"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import {
  notifyOffersChanged,
  offerActive,
  offerError,
  UUID_RE,
  type TradeOffer,
} from "@/lib/trade-offers";

export function useOffers({ poll = false }: { poll?: boolean } = {}) {
  const { userId } = useAuth();
  const [state, setState] = useState<{
    userId: string | null;
    offers: TradeOffer[];
    ready: boolean;
    error: string | null;
  }>({ userId: null, offers: [], ready: false, error: null });
  const identity = useRef(userId);
  identity.current = userId;
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    if (!userId) {
      setState({ userId, offers: [], ready: true, error: null });
      return;
    }
    try {
      const { data, error } = await getSupabase()
        .from("trade_offers")
        .select("*")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (identity.current === userId && sequence.current === request)
        setState({
          userId,
          offers: (data ?? []) as TradeOffer[],
          ready: true,
          error: null,
        });
    } catch {
      if (identity.current === userId && sequence.current === request)
        setState((previous) => ({
          userId,
          offers: previous.userId === userId ? previous.offers : [],
          ready: true,
          error: "Ponude nisu učitane. Pokušaj ponovo.",
        }));
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = userId && poll ? window.setInterval(onVisible, 15_000) : null;
    window.addEventListener("focus", onVisible);
    window.addEventListener("autotrampa:offers", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ++sequence.current;
      if (timer !== null) window.clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("autotrampa:offers", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll, refresh, userId]);

  const updateOffer = useCallback(
    async (id: string, action: "read" | "decline" | "withdraw") => {
      try {
        const { data, error } = await getSupabase().rpc("update_trade_offer", {
          p_offer_id: id,
          p_action: action,
        });
        if (error || data !== true)
          return { ok: false as const, message: offerError(error) };
        notifyOffersChanged();
        await refresh();
        return { ok: true as const };
      } catch {
        return { ok: false as const, message: offerError(null) };
      }
    },
    [refresh],
  );

  const openConversation = useCallback(
    async (id: string) => {
      try {
        const { data, error } = await getSupabase().rpc(
          "open_offer_conversation",
          { p_offer_id: id },
        );
        if (error || !UUID_RE.test(data ?? ""))
          return { ok: false as const, message: offerError(error) };
        notifyOffersChanged();
        await refresh();
        return { ok: true as const, id: data as string };
      } catch {
        return { ok: false as const, message: offerError(null) };
      }
    },
    [refresh],
  );
  const offers = state.userId === userId ? state.offers : [];
  return {
    offers,
    mounted: state.userId === userId && state.ready,
    error: state.userId === userId ? state.error : null,
    unread: offers.filter(
      (offer) =>
        offer.recipient_id === userId &&
        !offer.recipient_read_at &&
        offerActive(offer),
    ).length,
    refresh,
    updateOffer,
    openConversation,
  };
}

/** One offers subscription per listing screen, matched to the selected garage car. */
export function useActiveOfferIds(selectedCarId: string | null | undefined) {
  const { offers } = useOffers();
  return useMemo(() => {
    const ids = new Map<string, string>();
    if (!selectedCarId) return ids;
    for (const offer of offers) {
      if (!offerActive(offer)) continue;
      const otherCarId = offer.offered_car_id === selectedCarId
        ? offer.target_car_id
        : offer.target_car_id === selectedCarId
          ? offer.offered_car_id
          : null;
      if (otherCarId && !ids.has(otherCarId)) ids.set(otherCarId, offer.id);
    }
    return ids;
  }, [offers, selectedCarId]);
}
