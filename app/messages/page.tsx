'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, ArrowLeft, CheckCheck, Phone, Trash2, TriangleAlert, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { useMessages, Conversation } from '@/hooks/use-messages';

/** Delay the fake counterpart uses before answering — mirrors use-messages. */
const REPLY_DELAY = 1500;

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `${mins}m`;
  return 'sada';
}

function formatMessageTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Danas';
  if (sameDay(date, yesterday)) return 'Juče';
  return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'long' });
}

export default function MessagesPage() {
  const { conversations, sendMessage, markRead, deleteConversation, totalUnread, mounted } =
    useMessages();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv = conversations.find(c => c.id === activeId) || null;
  const messageCount = activeConv?.messages.length ?? 0;

  useEffect(() => {
    if (messageCount > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageCount, typing, activeId]);

  // The chat view covers the whole screen, so keep the page behind it still.
  useEffect(() => {
    if (!activeId) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (pendingDelete) setPendingDelete(null);
      else if (activeId) setActiveId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeId, pendingDelete]);

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  function openConversation(conv: Conversation) {
    setActiveId(conv.id);
    markRead(conv.id);
  }

  function handleSend() {
    const text = input.trim();
    if (!text || !activeId) return;
    sendMessage(activeId, text);
    setInput('');
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), REPLY_DELAY);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteConversation(pendingDelete.id);
    if (activeId === pendingDelete.id) setActiveId(null);
    toast.success(`Razgovor sa ${pendingDelete.ownerName} obrisan.`);
    setPendingDelete(null);
  }

  const deleteDialog = pendingDelete && (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-conv-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPendingDelete(null)} />
      <div className="relative w-full max-w-sm rounded-2xl border border-surface bg-card-surface p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
          <TriangleAlert size={22} className="text-rose-400" />
        </div>
        <h3 id="delete-conv-title" className="text-center text-base font-bold text-app-primary">
          Obrisati razgovor?
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-app-secondary">
          Ceo razgovor sa {pendingDelete.ownerName} biće trajno uklonjen.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setPendingDelete(null)}
            className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary transition-colors hover:bg-hover-surface"
          >
            Odustani
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-400"
          >
            Obriši
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-40 border-b border-surface bg-app px-4 py-4 safe-top">
          <h1 className="text-xl font-bold tracking-tight text-app-primary">Poruke</h1>
        </header>
        <div className="space-y-3 px-4 pt-6">
          <div className="h-20 animate-pulse rounded-2xl bg-card-surface" />
          <div className="h-20 animate-pulse rounded-2xl bg-card-surface" />
          <div className="h-20 animate-pulse rounded-2xl bg-card-surface" />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- CHAT */
  if (activeConv) {
    let lastDay = '';

    return (
      <>
        {/* Full-screen overlay: the composer would otherwise sit under the
            fixed bottom navigation. */}
        <div className="fixed inset-0 z-[60] flex flex-col bg-app">
          <header className="flex flex-shrink-0 items-center gap-3 border-b border-surface px-4 py-3 safe-top">
            <button
              onClick={() => setActiveId(null)}
              aria-label="Nazad na razgovore"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:text-app-primary"
            >
              <ArrowLeft size={18} />
            </button>

            <Link
              href={`/car/${activeConv.carId}`}
              className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-elevated"
              aria-label={`Otvori oglas ${activeConv.carTitle}`}
            >
              <img src={activeConv.carImage} alt="" className="h-full w-full object-cover" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-app-primary">{activeConv.ownerName}</p>
              <p className="truncate text-xs text-app-muted">{activeConv.carTitle}</p>
            </div>

            {activeConv.ownerPhone && (
              <a
                href={`tel:${activeConv.ownerPhone}`}
                aria-label={`Pozovi ${activeConv.ownerName}`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:text-orange-400"
              >
                <Phone size={16} />
              </a>
            )}
            <button
              onClick={() => setPendingDelete(activeConv)}
              aria-label="Obriši razgovor"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:text-rose-400"
            >
              <Trash2 size={16} />
            </button>
          </header>

          <Link
            href={`/car/${activeConv.carId}`}
            className="mx-4 mt-3 flex flex-shrink-0 items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 transition-colors hover:bg-orange-500/15"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
              <ArrowLeftRight size={12} />
              {activeConv.tradeSummary}
            </span>
            <span className="text-[10px] text-app-muted">Pogledaj oglas</span>
          </Link>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {activeConv.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-elevated">
                  <MessageCircle size={26} className="text-app-muted" />
                </div>
                <p className="text-sm font-medium text-app-secondary">Još nema poruka</p>
                <p className="mt-1 text-xs text-app-muted">Pošalji prvu poruku ispod</p>
              </div>
            ) : (
              activeConv.messages.map(msg => {
                const day = formatDayLabel(msg.timestamp);
                const showDay = day !== lastDay;
                lastDay = day;
                const mine = msg.sender === 'me';

                return (
                  <div key={msg.id}>
                    {showDay && (
                      <div className="my-4 flex justify-center">
                        <span className="rounded-full bg-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                          {day}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                          mine
                            ? 'rounded-br-md bg-orange-500 text-white'
                            : 'rounded-bl-md bg-elevated text-app-primary'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                          {msg.text}
                        </p>
                        <div
                          className={`mt-1 flex items-center gap-1 ${
                            mine ? 'justify-end text-white/70' : 'text-app-muted'
                          }`}
                        >
                          <span className="text-[9px]">{formatMessageTime(msg.timestamp)}</span>
                          {mine && <CheckCheck size={11} className="text-white/80" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {typing && (
              <div className="flex justify-start" aria-live="polite">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-elevated px-4 py-3">
                  <span className="sr-only">{activeConv.ownerName} kuca…</span>
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-muted"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 border-t border-surface bg-app px-4 py-3 safe-bottom">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              maxLength={1000}
              placeholder="Napiši poruku..."
              aria-label="Poruka"
              className="flex-1 rounded-full border border-surface bg-elevated px-4 py-2.5 text-sm text-app-primary transition-colors placeholder:text-app-muted focus:border-orange-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Pošalji poruku"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-all duration-200 hover:bg-orange-400 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>

        {deleteDialog}
      </>
    );
  }

  /* ------------------------------------------------------------ INBOX */
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 border-b border-surface bg-app px-4 py-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary">Poruke</h1>
            <p className="mt-0.5 text-xs text-app-muted">
              {conversations.length === 0
                ? 'Razgovori o zameni'
                : `${conversations.length} ${conversations.length === 1 ? 'razgovor' : 'razgovora'}`}
            </p>
          </div>
          {totalUnread > 0 && (
            <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-rose-500 px-1.5">
              <span className="text-xs font-bold text-white">{totalUnread}</span>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-2 px-4 pb-4 pt-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-elevated/60">
              <MessageCircle size={36} className="text-app-muted" />
            </div>
            <p className="text-base font-semibold text-app-secondary">Nema razgovora</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-muted">
              Pošalji ponudu za trampu sa Početne da započneš razgovor sa drugim vlasnicima.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400"
            >
              <ArrowLeftRight size={16} />
              Pronađi zamenu
            </Link>
          </div>
        ) : (
          conversations.map(conv => {
            const lastMsg = conv.messages[conv.messages.length - 1];
            return (
              <div
                key={conv.id}
                className="group flex items-center gap-3 rounded-2xl border border-surface bg-card-surface p-3 transition-all duration-200 hover:bg-hover-surface"
              >
                <button
                  onClick={() => openConversation(conv)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-elevated">
                    <img src={conv.carImage} alt="" className="h-full w-full object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-app-primary">{conv.ownerName}</p>
                      <span className="flex-shrink-0 text-[10px] text-app-muted">
                        {formatTime(conv.lastUpdated)}
                      </span>
                    </div>
                    <p className="mb-1 truncate text-xs text-app-muted">{conv.carTitle}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${
                          conv.unread > 0 ? 'font-medium text-app-primary' : 'text-app-muted'
                        }`}
                      >
                        {lastMsg
                          ? (lastMsg.sender === 'me' ? 'Ti: ' : '') + lastMsg.text
                          : 'Još nema poruka'}
                      </p>
                      <span className="flex-shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                        {conv.tradeSummary}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
                  {conv.unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {conv.unread}
                    </span>
                  )}
                  <button
                    onClick={() => setPendingDelete(conv)}
                    aria-label={`Obriši razgovor sa ${conv.ownerName}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {deleteDialog}
    </div>
  );
}
