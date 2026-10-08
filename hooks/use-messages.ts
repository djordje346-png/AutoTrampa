'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { userStore } from '@/hooks/use-user';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
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

interface MessageRow {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ConversationRow {
  id: string;
  car_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  trade_summary: string;
  updated_at: string;
  created_at: string;
  car: {
    brand: string;
    model: string;
    generation: string | null;
    year: number;
    image: string | null;
    owner_name: string | null;
  } | null;
  messages: MessageRow[] | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapConversation(row: ConversationRow, userId: string): Conversation | null {
  if (!row.car) return null;
  const messages = [...(row.messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const isBuyer = row.buyer_id === userId;
  return {
    id: row.id,
    carId: row.car_id,
    carTitle: `${row.car.year} ${row.car.brand} ${row.car.model} ${row.car.generation ?? ''}`.trim(),
    carImage: row.car.image ?? '',
    ownerName: isBuyer ? row.car.owner_name ?? 'Korisnik' : row.buyer_name || 'Korisnik',
    ownerPhone: '',
    tradeSummary: row.trade_summary,
    messages: messages.map((message) => ({
      id: message.id,
      text: message.body,
      sender: message.sender_id === userId ? 'me' : 'them',
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
        .select('id,car_id,buyer_id,seller_id,buyer_name,trade_summary,updated_at,created_at,car:cars!conversations_car_id_fkey(brand,model,generation,year,image,owner_name),messages:messages!messages_conversation_id_fkey(id,sender_id,body,created_at,read_at)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as ConversationRow[];
      setConversations(rows.map((row) => mapConversation(row, userId)).filter((item): item is Conversation => Boolean(item)));
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
      .neq('sender_id', userId)
      .is('read_at', null);
    if (!error) await refresh();
  }, [refresh, userId]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId) return false;
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return false;
    const field = conversation.isBuyer ? 'buyer_archived' : 'seller_archived';
    const { data, error } = await getSupabase()
      .from('conversations')
      .update({ [field]: true })
      .eq('id', conversationId)
      .select('id')
      .maybeSingle();
    if (error || !data) return false;
    setConversations((previous) => previous.filter((item) => item.id !== conversationId));
    return true;
  }, [conversations, userId]);

  const createConversation = useCallback(async (
    conv: {
      carId: string;
      carTitle: string;
      carImage: string;
      ownerName: string;
      ownerId?: string;
      tradeSummary: string;
    },
    firstMessage?: string,
  ): Promise<{ ok: true; id: string } | { ok: false; message: string }> => {
    if (!userId) return { ok: false, message: 'Prijavi se da pošalješ ponudu.' };
    if (!UUID_RE.test(conv.carId) || !conv.ownerId || !UUID_RE.test(conv.ownerId)) {
      return { ok: false, message: 'Ovo je demo oglas i nema aktivnog vlasnika za razgovor.' };
    }
    if (conv.ownerId === userId) return { ok: false, message: 'Ne možeš poslati ponudu za svoj oglas.' };

    const supabase = getSupabase();
    let conversationId: string | null = null;
    const { data: existing, error: lookupError } = await supabase
      .from('conversations')
      .select('id')
      .eq('car_id', conv.carId)
      .eq('buyer_id', userId)
      .eq('seller_id', conv.ownerId)
      .maybeSingle();
    if (lookupError) return { ok: false, message: lookupError.message };
    conversationId = existing?.id ?? null;

    if (!conversationId) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          car_id: conv.carId,
          buyer_id: userId,
          seller_id: conv.ownerId,
          buyer_name: userStore.get().name,
          trade_summary: conv.tradeSummary,
        })
        .select('id')
        .single();
      if (error) {
        // A concurrent offer can win the unique constraint; reuse its thread.
        if (error.code !== '23505') return { ok: false, message: error.message };
        const { data: raced } = await supabase
          .from('conversations')
          .select('id')
          .eq('car_id', conv.carId)
          .eq('buyer_id', userId)
          .eq('seller_id', conv.ownerId)
          .maybeSingle();
        conversationId = raced?.id ?? null;
      } else {
        conversationId = data.id;
      }
    }

    if (!conversationId) return { ok: false, message: 'Razgovor nije mogao da se otvori.' };
    const body = firstMessage?.trim() || `Zdravo! Šaljem ponudu za zamenu — ${conv.tradeSummary}.`;
    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: body.slice(0, 1000),
    });
    if (messageError) return { ok: false, message: messageError.message };
    await refresh();
    return { ok: true, id: conversationId };
  }, [refresh, userId]);

  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unread, 0);
  return { conversations, sendMessage, markRead, createConversation, deleteConversation, totalUnread, mounted };
}
