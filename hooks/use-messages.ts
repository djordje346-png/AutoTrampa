'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { carTitle } from '@/lib/cars';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them' | 'system';
  timestamp: number;
}

export interface Conversation {
  id: string;
  carId: string;
  carTitle: string;
  carImage: string;
  ownerName: string;
  ownerPhone?: string;
  tradeSummary: string;
  messages: ChatMessage[];
  unread: number;
  lastUpdated: number;
  isBuyer: boolean;
}

export interface MessageRow {
  id: string;
  sender_id: string | null;
  kind: 'text' | 'match';
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ConversationCarRow {
  brand: string;
  model: string;
  generation: string | null;
  year: number | null;
  image: string | null;
  owner_name: string | null;
}

export interface ConversationRow {
  id: string;
  car_id: string;
  offered_car_id: string | null;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  trade_summary: string;
  updated_at: string;
  created_at: string;
  car: ConversationCarRow | null;
  offered_car: ConversationCarRow | null;
  messages: MessageRow[] | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function mapConversation(row: ConversationRow, userId: string): Conversation {
  const messages = [...(row.messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const isBuyer = row.buyer_id === userId;
  const showOfferedCar = !isBuyer && Boolean(row.offered_car);
  const displayedCar = showOfferedCar ? row.offered_car : row.car;
  return {
    id: row.id,
    carId: showOfferedCar ? row.offered_car_id ?? row.car_id : row.car_id,
    carTitle: displayedCar
      ? [carTitle(displayedCar), displayedCar.generation && displayedCar.generation !== '-' ? displayedCar.generation : ''].filter(Boolean).join(' ')
      : 'Oglas više nije dostupan',
    carImage: displayedCar?.image ?? '',
    ownerName: isBuyer
      ? row.car?.owner_name || 'Korisnik'
      : row.offered_car?.owner_name || row.buyer_name || 'Korisnik',
    ownerPhone: '',
    tradeSummary: row.trade_summary,
    messages: messages.map((message) => ({
      id: message.id,
      text: message.body,
      sender: message.kind === 'match' ? 'system' : message.sender_id === userId ? 'me' : 'them',
      timestamp: new Date(message.created_at).getTime(),
    })),
    unread: messages.filter((message) => message.sender_id !== userId && !message.read_at).length,
    lastUpdated: new Date(row.updated_at ?? row.created_at).getTime(),
    isBuyer,
  };
}

export function useMessages(options?: { poll?: boolean }) {
  const { userId } = useAuth();
  // The footer asks for unread counts on every route, but polling belongs to
  // the Poruke screen: anywhere else this only subscribes for the badge.
  const poll = options?.poll ?? true;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setMounted(true);
      return;
    }
    try {
      const { data, error } = await getSupabase()
        .from('conversations')
        .select('id,car_id,offered_car_id,buyer_id,seller_id,buyer_name,trade_summary,updated_at,created_at,car:cars!conversations_car_id_fkey(brand,model,generation,year,image,owner_name),offered_car:cars!conversations_offered_car_id_fkey(brand,model,generation,year,image,owner_name),messages:messages!messages_conversation_id_fkey(id,sender_id,kind,body,created_at,read_at)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ConversationRow[];
      setConversations(rows.map((row) => mapConversation(row, userId)));
    } catch {
      setConversations([]);
    } finally {
      setMounted(true);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setConversations([]);
      setMounted(true);
      return;
    }
    setMounted(false);
    const load = async () => {
      if (cancelled) return;
      await refresh();
    };
    void load();

    const timer = poll ? window.setInterval(load, 20_000) : null;
    // Coming back to the tab is the other moment the count can be stale.
    // Only refresh when there is a session, so signed-out browsing stays quiet.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearInterval(timer);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [poll, refresh, userId]);

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    const body = text.trim().slice(0, 1000);
    if (!userId || !body) return false;
    const { error } = await getSupabase().from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
    });
    if (error) return false;
    await refresh();
    return true;
  }, [refresh, userId]);

  const markRead = useCallback(async (conversationId: string) => {
    if (!userId) return;
    const { error } = await getSupabase()
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .or(`sender_id.is.null,sender_id.neq.${userId}`)
      .is('read_at', null);
    if (!error) await refresh();
  }, [refresh, userId]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId) return false;
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return false;
    const { data, error } = await getSupabase().rpc('archive_conversation', {
      p_conversation_id: conversationId,
    });
    if (error) {
      console.error('Razgovor nije arhiviran.', { code: error.code, message: error.message });
      return false;
    }
    if (data !== true) return false;
    setConversations((previous) => previous.filter((item) => item.id !== conversationId));
    return true;
  }, [conversations, userId]);

  const createConversation = useCallback(async (
    conv: {
      carId: string;
      offeredCarId: string;
      ownerId?: string;
    },
    firstMessage?: string,
  ): Promise<{ ok: true; id: string } | { ok: false; message: string }> => {
    if (!userId) return { ok: false, message: 'Prijavi se da pošalješ ponudu.' };
    if (!UUID_RE.test(conv.carId) || (conv.ownerId && !UUID_RE.test(conv.ownerId))) {
      return { ok: false, message: 'Ovo je demo oglas i nema aktivnog vlasnika za razgovor.' };
    }
    if (!UUID_RE.test(conv.offeredCarId)) {
      return { ok: false, message: 'Za ponudu izaberi svoj sačuvani automobil iz garaže.' };
    }
    if (conv.ownerId === userId || conv.carId === conv.offeredCarId) {
      return { ok: false, message: 'Ne možeš poslati ponudu za svoj oglas.' };
    }

    try {
      const { data, error } = await getSupabase().rpc('send_trade_offer', {
        p_target_car_id: conv.carId,
        p_offered_car_id: conv.offeredCarId,
        p_message: firstMessage?.trim().slice(0, 1000) ?? '',
      });
      if (error) return { ok: false, message: error.message };
      const conversationId = data?.conversation_id;
      if (typeof conversationId !== 'string' || !UUID_RE.test(conversationId)) {
        return { ok: false, message: 'Razgovor nije mogao da se otvori.' };
      }
      await refresh();
      return { ok: true, id: conversationId };
    } catch {
      return { ok: false, message: 'Ponuda nije poslata. Proveri vezu i pokušaj ponovo.' };
    }
  }, [refresh, userId]);

  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unread, 0);
  return { conversations, sendMessage, markRead, createConversation, deleteConversation, totalUnread, mounted };
}

