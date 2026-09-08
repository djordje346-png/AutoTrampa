'use client';

import { useCallback, useEffect } from 'react';
import { createPersistentStore, usePersistentStore } from '@/lib/persistent-store';

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
  /** Trade label as it stood when the offer was sent. */
  tradeSummary: string;
  messages: ChatMessage[];
  unread: number;
  lastUpdated: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * Seed chats are built on the client at hydration time, not at module load:
 * timestamps are relative to "now" and would otherwise differ between the
 * server render and the browser.
 */
function createSeedConversations(): Conversation[] {
  const now = Date.now();
  return [
    {
      id: 'conv-marko',
      carId: 'audi-a4-b7-avant',
      carTitle: '2006 Audi A4 Avant B7',
      carImage:
        'https://images.pexels.com/photos/37472548/pexels-photo-37472548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      ownerName: 'Marko D.',
      ownerPhone: '+381 63 987 6543',
      tradeSummary: 'Vlasnik doplaćuje 700 €',
      unread: 1,
      lastUpdated: now - HOUR,
      messages: [
        { id: 'm1', text: 'Zdravo! Zanima te zamena tvog BMW-a za moj A4 Avant?', sender: 'them', timestamp: now - 2 * HOUR },
        { id: 'm2', text: 'Ćao Marko, video sam oglas. Kakvo je stanje lima?', sender: 'me', timestamp: now - 116 * MINUTE },
        { id: 'm3', text: 'Lim je čist, bez rđe. Kompletna servisna knjižica iz Audi servisa.', sender: 'them', timestamp: now - 113 * MINUTE },
        { id: 'm4', text: 'Zvuči dobro. Trebalo bi 700 € doplate jer je moj E60 vredniji.', sender: 'me', timestamp: now - 110 * MINUTE },
        { id: 'm5', text: 'To mi odgovara. Kad možemo da se nađemo?', sender: 'them', timestamp: now - HOUR },
      ],
    },
    {
      id: 'conv-stefan',
      carId: 'vw-golf-5-gti',
      carTitle: '2007 VW Golf GTI Mk5',
      carImage:
        'https://images.pexels.com/photos/20809165/pexels-photo-20809165.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      ownerName: 'Stefan J.',
      ownerPhone: '+381 65 445 1122',
      tradeSummary: 'Tvoja doplata 700 €',
      unread: 0,
      lastUpdated: now - 24 * HOUR,
      messages: [
        { id: 'm1', text: 'Ej, video sam tvoj E60 u feed-u. Čist auto!', sender: 'them', timestamp: now - 25 * HOUR },
        { id: 'm2', text: 'Hvala brate. I tvoj GTI izgleda odlično.', sender: 'me', timestamp: now - 24.5 * HOUR },
        { id: 'm3', text: 'Bi li doplatio za GTI? Moj je nešto skuplji.', sender: 'them', timestamp: now - 24 * HOUR },
      ],
    },
    {
      id: 'conv-petar',
      carId: 'bmw-320d-e90',
      carTitle: '2009 BMW 320d E90',
      carImage:
        'https://images.pexels.com/photos/31983216/pexels-photo-31983216.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      ownerName: 'Petar K.',
      ownerPhone: '+381 64 771 2390',
      tradeSummary: 'Vlasnik doplaćuje 2.400 €',
      unread: 2,
      lastUpdated: now - 2 * HOUR,
      messages: [
        { id: 'm1', text: 'Zdravo, da li si otvoren za zamenu sa mojim E90?', sender: 'them', timestamp: now - 3 * HOUR },
        { id: 'm2', text: 'Ćao Petre, moguće. Ali E90 je vredniji od mog E60.', sender: 'me', timestamp: now - 170 * MINUTE },
        { id: 'm3', text: 'Znam, doplatio bih 2.400 €. M-Sport paket uključen.', sender: 'them', timestamp: now - 2 * HOUR },
        { id: 'm4', text: 'Pošalji mi još slika enterijera?', sender: 'me', timestamp: now - 118 * MINUTE },
      ],
    },
  ];
}

const AUTO_REPLIES = [
  'Zvuči dobro!',
  'Daj da razmislim malo.',
  'Možemo li ovaj vikend da se nađemo?',
  'Važi, to mi odgovara. Gde si lociran?',
  'Otvoren sam za to. Pošalji mi broj telefona.',
  'Hmm, može li malo bolja cena?',
  'Dogovoreno. Kada hoćeš da se nađemo?',
  'Hvala na ponudi, javljam se uskoro.',
];

const conversationsStore = createPersistentStore<Conversation[]>(
  'autotrampa_messages',
  [],
  (raw) => (Array.isArray(raw) ? (raw as Conversation[]) : null),
);

/** Separate marker so an intentionally emptied inbox is not re-seeded. */
const seededStore = createPersistentStore<boolean>('autotrampa_messages_seeded', false);

function ensureSeeded() {
  seededStore.hydrate();
  conversationsStore.hydrate();
  if (seededStore.get()) return;
  seededStore.set(true);
  if (conversationsStore.get().length === 0) {
    conversationsStore.set(createSeedConversations());
  }
}

function byRecency(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => b.lastUpdated - a.lastUpdated);
}

export function useMessages() {
  const [stored, mounted] = usePersistentStore(conversationsStore);

  useEffect(() => {
    ensureSeeded();
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: trimmed,
      sender: 'me',
      timestamp: Date.now(),
    };

    conversationsStore.set((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, userMsg], lastUpdated: Date.now(), unread: 0 }
          : c,
      ),
    );

    // Simulated counterpart until there is a backend.
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now()}-r`,
        text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        sender: 'them',
        timestamp: Date.now(),
      };
      conversationsStore.set((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, replyMsg], lastUpdated: Date.now() }
            : c,
        ),
      );
    }, 1500);
  }, []);

  const markRead = useCallback((conversationId: string) => {
    conversationsStore.set((prev) => {
      if (!prev.some((c) => c.id === conversationId && c.unread > 0)) return prev;
      return prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c));
    });
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    conversationsStore.set((prev) => prev.filter((c) => c.id !== conversationId));
  }, []);

  /**
   * Opens (or reuses) the thread for a listing and posts the offer as the first
   * message, so what the user typed in the offer sheet actually lands in chat.
   */
  const createConversation = useCallback(
    (
      conv: Omit<Conversation, 'messages' | 'lastUpdated' | 'unread'>,
      firstMessage?: string,
    ): string => {
      const existing = conversationsStore.get().find((c) => c.carId === conv.carId);
      const id = existing?.id ?? conv.id;
      const now = Date.now();

      const offerMessage: ChatMessage = {
        id: `msg-${now}`,
        text:
          firstMessage?.trim() ||
          `Zdravo! Šaljem ponudu za zamenu — ${conv.tradeSummary}.`,
        sender: 'me',
        timestamp: now,
      };

      conversationsStore.set((prev) => {
        if (existing) {
          return prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  tradeSummary: conv.tradeSummary,
                  messages: [...c.messages, offerMessage],
                  lastUpdated: now,
                  unread: 0,
                }
              : c,
          );
        }
        return [
          { ...conv, id, messages: [offerMessage], unread: 0, lastUpdated: now },
          ...prev,
        ];
      });

      return id;
    },
    [],
  );

  const conversations = byRecency(stored);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return {
    conversations,
    sendMessage,
    markRead,
    createConversation,
    deleteConversation,
    totalUnread,
    mounted,
  };
}
