'use client';

import { useState, useEffect, useCallback } from 'react';

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
  tradeSummary: string;
  messages: ChatMessage[];
  unread: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'autotrampa_messages';

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-marko',
    carId: 'audi-a4-b7-avant',
    carTitle: '2006 Audi A4 Avant B7',
    carImage: 'https://images.pexels.com/photos/37472548/pexels-photo-37472548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ownerName: 'Marko D.',
    tradeSummary: 'They add €700',
    unread: 1,
    lastUpdated: Date.now() - 3600000,
    messages: [
      { id: 'm1', text: 'Hi! Interested in trading your BMW for my A4 Avant?', sender: 'them', timestamp: Date.now() - 7200000 },
      { id: 'm2', text: 'Hey Marko, yeah I saw your listing. What condition is the body in?', sender: 'me', timestamp: Date.now() - 7000000 },
      { id: 'm3', text: 'Body is clean, no rust. Full service history from Audi.', sender: 'them', timestamp: Date.now() - 6800000 },
      { id: 'm4', text: 'Sounds good. I would need €700 on top since my E60 is worth more.', sender: 'me', timestamp: Date.now() - 6600000 },
      { id: 'm5', text: 'That works for me. When can we meet?', sender: 'them', timestamp: Date.now() - 3600000 },
    ],
  },
  {
    id: 'conv-stefan',
    carId: 'vw-golf-5-gti',
    carTitle: '2007 VW Golf GTI Mk5',
    carImage: 'https://images.pexels.com/photos/20809165/pexels-photo-20809165.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ownerName: 'Stefan J.',
    tradeSummary: 'You add €700',
    unread: 0,
    lastUpdated: Date.now() - 86400000,
    messages: [
      { id: 'm1', text: 'Yo, saw your E60 in the feed. Clean car!', sender: 'them', timestamp: Date.now() - 90000000 },
      { id: 'm2', text: 'Thanks man. Your GTI looks sharp too.', sender: 'me', timestamp: Date.now() - 88000000 },
      { id: 'm3', text: 'Would you add cash for the GTI? Mine is priced a bit higher.', sender: 'them', timestamp: Date.now() - 86400000 },
    ],
  },
  {
    id: 'conv-petar',
    carId: 'bmw-320d-e90',
    carTitle: '2009 BMW 320d E90',
    carImage: 'https://images.pexels.com/photos/31983216/pexels-photo-31983216.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ownerName: 'Petar K.',
    tradeSummary: 'They add €2,400',
    unread: 2,
    lastUpdated: Date.now() - 7200000,
    messages: [
      { id: 'm1', text: 'Hello, are you open to a trade with my E90?', sender: 'them', timestamp: Date.now() - 10000000 },
      { id: 'm2', text: 'Hi Petar, possibly. The E90 is worth more than my E60 though.', sender: 'me', timestamp: Date.now() - 9500000 },
      { id: 'm3', text: 'I know, I would add €2,400 on top. M-Sport package included.', sender: 'them', timestamp: Date.now() - 7200000 },
      { id: 'm4', text: 'Send me some more photos of the interior?', sender: 'me', timestamp: Date.now() - 7100000 },
    ],
  },
];

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return SEED_CONVERSATIONS;
}

const AUTO_REPLIES = [
  'Sounds good to me!',
  'Let me think about it.',
  'Can we meet this weekend?',
  'Sure, that works. Where are you located?',
  'I am open to that. Send me your number.',
  'Hmm, can you do a bit better on the price?',
  'Deal. When do you want to meet up?',
  'Thanks for the offer, I will get back to you soon.',
];

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConversations(loadConversations());
    setMounted(true);
  }, []);

  function persist(next: Conversation[]) {
    setConversations(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const sendMessage = useCallback((conversationId: string, text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: text.trim(),
      sender: 'me',
      timestamp: Date.now(),
    };

    let replyConv: Conversation | null = null;

    setConversations(prev => {
      const next = prev.map(c => {
        if (c.id !== conversationId) return c;
        const updated = {
          ...c,
          messages: [...c.messages, userMsg],
          lastUpdated: Date.now(),
          unread: 0,
        };
        replyConv = updated;
        return updated;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Simulate auto-reply after 1.5s
    setTimeout(() => {
      const replyText = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now()}-r`,
        text: replyText,
        sender: 'them',
        timestamp: Date.now(),
      };

      setConversations(prev => {
        const next = prev.map(c => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            messages: [...c.messages, replyMsg],
            lastUpdated: Date.now(),
            unread: 0,
          };
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }, 1500);
  }, []);

  const markRead = useCallback((conversationId: string) => {
    setConversations(prev => {
      const next = prev.map(c =>
        c.id === conversationId ? { ...c, unread: 0 } : c
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const createConversation = useCallback((conv: Omit<Conversation, 'messages' | 'lastUpdated' | 'unread'>) => {
    const newConv: Conversation = {
      ...conv,
      messages: [],
      unread: 0,
      lastUpdated: Date.now(),
    };
    setConversations(prev => {
      // Don't duplicate by carId
      const existing = prev.find(c => c.carId === conv.carId);
      if (existing) return prev;
      const next = [newConv, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    return newConv.id;
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return {
    conversations,
    sendMessage,
    markRead,
    createConversation,
    totalUnread,
    mounted,
  };
}
