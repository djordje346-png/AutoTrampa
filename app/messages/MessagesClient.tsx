'use client';

import { useState, useRef, useEffect, type RefObject } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, ArrowLeft, Check, Phone, Archive, TriangleAlert, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage, Conversation } from '@/hooks/use-messages';
import { useAuth } from '@/hooks/use-auth';
import { useContactPhone } from '@/hooks/use-contact-phone';
import { contactPhoneMessage } from '@/lib/contact-phone';
import { SignedOutPage } from '@/components/SignedOut';

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

function MessageHistory({
  messages,
  scrollRef,
}: {
  messages: ChatMessage[];
  scrollRef: RefObject<HTMLDivElement>;
}) {
  let lastDay = '';

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-elevated">
            <MessageCircle size={26} className="text-app-muted" />
          </div>
          <p className="text-sm font-medium text-app-secondary dark:text-app-secondary">Još nema poruka</p>
          <p className="mt-1 text-xs text-app-muted">Pošalji prvu poruku ispod</p>
        </div>
      ) : (
        messages.map((msg) => {
          const day = formatDayLabel(msg.timestamp);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = msg.sender === 'me';

          return (
            <div key={msg.id}>
              {showDay && (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full bg-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-app-muted">
                    {day}
                  </span>
                </div>
              )}
              {msg.sender === 'system' ? (
                <div className="flex justify-center">
                  <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-center text-xs leading-relaxed text-app-secondary dark:text-app-secondary">
                    <p className="font-semibold text-brand-text">{msg.text}</p>
                    <span className="mt-1 block text-[10px] text-app-muted">{formatMessageTime(msg.timestamp)}</span>
                  </div>
                </div>
              ) : (
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                      mine
                        ? 'rounded-br-md bg-brand-500 text-on-accent'
                        : 'rounded-bl-md bg-elevated text-app-primary dark:text-app-primary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-snug">{msg.text}</p>
                    <div className={`mt-1 flex items-center gap-1 ${mine ? 'justify-end text-primary-foreground/60' : 'text-app-muted'}`}>
                      <span className="text-[10px]">{formatMessageTime(msg.timestamp)}</span>
                      {mine && <Check size={12} />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function ConversationThread({
  conversation,
  contact,
  input,
  onInputChange,
  sending,
  onSend,
  onArchive,
  scrollRef,
  fullScreen = false,
  onBack,
}: {
  conversation: Conversation;
  contact: ReturnType<typeof useContactPhone>;
  input: string;
  onInputChange: (value: string) => void;
  sending: boolean;
  onSend: () => void;
  onArchive: () => void;
  scrollRef: RefObject<HTMLDivElement>;
  fullScreen?: boolean;
  onBack?: () => void;
}) {
  const contactNote = contactPhoneMessage(contact.status);

  async function handleCall() {
    const current = await contact.dial();
    const message = contactPhoneMessage(current.status);
    if (message) toast.message(message);
  }

  return (
    <section
      aria-label={`Razgovor sa ${conversation.ownerName}`}
      className={fullScreen
        ? 'fixed inset-0 z-[60] flex flex-col bg-app dark:bg-app'
        : 'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-surface bg-card-surface shadow-sm dark:border-surface dark:bg-card-surface'}
    >
      <header className={`flex flex-shrink-0 items-center gap-3 border-b border-surface px-4 py-3 dark:border-surface ${fullScreen ? 'safe-top' : ''}`}>
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Nazad na razgovore"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:text-app-primary"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <Link
          href={`/car/${conversation.carId}`}
          className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-elevated"
          aria-label={`Otvori oglas ${conversation.carTitle}`}
        >
          <img src={conversation.carImage} alt="" className="h-full w-full object-cover" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-app-primary dark:text-app-primary">{conversation.ownerName}</p>
          <p className="truncate text-xs text-app-muted">{conversation.carTitle}</p>
        </div>

        {contact.href ? (
          <a
            href={contact.href}
            onClick={(event) => { event.preventDefault(); void handleCall(); }}
            aria-label={`Pozovi ${conversation.ownerName}`}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:text-brand-text dark:text-app-secondary"
          >
            <Phone size={16} />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void handleCall()}
            aria-label="Proveri dostupnost broja telefona sagovornika"
            title={contactNote ?? undefined}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:text-brand-text dark:text-app-secondary"
          >
            <Phone size={16} />
          </button>
        )}
        <button
          onClick={onArchive}
          aria-label="Arhiviraj razgovor"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated text-app-secondary transition-colors hover:bg-tone-negative-surface hover:text-tone-negative dark:text-app-secondary"
        >
          <Archive size={16} />
        </button>
      </header>

      <div className="mx-4 mt-3 flex flex-shrink-0 items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-text">
          <ArrowLeftRight size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">Ponuda za zamenu</p>
          <p className="truncate text-sm font-semibold text-app-primary dark:text-app-primary">{conversation.tradeSummary}</p>
        </div>
        <Link
          href={`/car/${conversation.carId}`}
          className="flex-shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-500/10"
        >
          Oglas
        </Link>
      </div>

      {contactNote && <p className="mx-4 mt-2 flex-shrink-0 text-[11px] leading-relaxed text-app-muted" role="status">{contactNote}</p>}

      <MessageHistory messages={conversation.messages} scrollRef={scrollRef} />

      <div className={`flex flex-shrink-0 items-center gap-2 border-t border-surface bg-app px-4 py-3 dark:border-surface dark:bg-app ${fullScreen ? 'safe-bottom' : ''}`}>
        <input
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          maxLength={1000}
          placeholder="Napiši poruku..."
          aria-label="Poruka"
          className="min-w-0 flex-1 rounded-full border border-surface bg-elevated px-4 py-2.5 text-sm text-app-primary transition-colors placeholder:text-app-muted focus:border-brand-500 focus:outline-none dark:border-surface dark:text-app-primary"
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || sending}
          aria-label="Pošalji poruku"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-on-accent transition-all duration-200 hover:bg-brand-600 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </div>
    </section>
  );
}

export default function MessagesClient() {
  const { conversations, sendMessage, markRead, deleteConversation, totalUnread, mounted } =
    useMessages({ poll: true });
  const { isLoggedIn, mounted: authReady } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);
  const [desktopLayout, setDesktopLayout] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeId) || null;
  const activeContact = useContactPhone(activeConv ? { conversationId: activeConv.id } : null);
  const messageCount = activeConv?.messages.length ?? 0;

  useEffect(() => {
    if (messageCount <= 0) return;
    [mobileScrollRef.current, desktopScrollRef.current].forEach((element) => {
      if (element) element.scrollTop = element.scrollHeight;
    });
  }, [messageCount, activeId]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1200px)');
    const updateLayout = () => setDesktopLayout(media.matches);
    updateLayout();
    media.addEventListener('change', updateLayout);
    return () => media.removeEventListener('change', updateLayout);
  }, []);

  // Lock the page only while the mobile full-screen chat is open.
  useEffect(() => {
    if (!activeId || desktopLayout) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeId, desktopLayout]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (pendingDelete) setPendingDelete(null);
      else if (activeId) setActiveId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeId, pendingDelete]);

  function openConversation(conv: Conversation) {
    setActiveId(conv.id);
    void markRead(conv.id);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const ok = await sendMessage(activeId, text);
    setSending(false);
    if (!ok) {
      toast.error('Poruka nije poslata. Proveri vezu i pokušaj ponovo.');
      return;
    }
    setInput('');
  }

  async function confirmDelete() {
    if (!pendingDelete || archiving) return;
    setArchiving(true);
    const ok = await deleteConversation(pendingDelete.id);
    setArchiving(false);
    if (!ok) {
      toast.error('Razgovor nije arhiviran. Pokušaj ponovo.');
      return;
    }
    if (activeId === pendingDelete.id) setActiveId(null);
    toast.success(`Razgovor sa ${pendingDelete.ownerName} arhiviran.`);
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
      <div className="relative w-full max-w-sm rounded-2xl border border-surface dark:border-surface bg-card-surface dark:bg-card-surface p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tone-negative-surface">
          <TriangleAlert size={22} className="text-tone-negative" />
        </div>
        <h3 id="delete-conv-title" className="text-center text-base font-bold text-app-primary dark:text-app-primary">
          Arhivirati razgovor?
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-app-secondary dark:text-app-secondary">
          Razgovor sa {pendingDelete.ownerName} biće sakriven samo sa tvog naloga.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setPendingDelete(null)}
            className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-app-primary transition-colors hover:bg-hover-surface"
          >
            Odustani
          </button>
          <button
            onClick={() => void confirmDelete()}
            className="flex-1 rounded-xl bg-tone-negative py-3 text-sm font-bold text-on-tone-negative transition-opacity hover:opacity-90"
          >
            {archiving ? 'Arhiviram…' : 'Arhiviraj'}
          </button>
        </div>
      </div>
    </div>
  );

  const desktopConversationList = (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-surface bg-card-surface dark:border-surface dark:bg-card-surface">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-surface px-4 py-4 dark:border-surface">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-app-primary dark:text-app-primary">Poruke</h1>
          <p className="mt-0.5 text-xs text-app-muted">
            {conversations.length === 0
              ? 'Razgovori o zameni'
              : `${conversations.length} ${conversations.length === 1 ? 'razgovor' : 'razgovora'}`}
          </p>
        </div>
        {totalUnread > 0 && (
          <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-brand-500 px-2 text-xs font-bold text-on-accent">
            {totalUnread}
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-elevated">
              <MessageCircle size={23} className="text-app-muted" />
            </div>
            <p className="text-sm font-semibold text-app-primary dark:text-app-primary">Nema razgovora</p>
            <p className="mt-1 text-xs leading-relaxed text-app-muted">Pošalji ponudu za trampu da započneš razgovor.</p>
            <Link href="/" className="mt-4 text-xs font-semibold text-brand-text hover:underline">
              Pronađi zamenu
            </Link>
          </div>
        ) : (
          conversations.map((conversation) => {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const active = conversation.id === activeId;
            return (
              <div
                key={conversation.id}
                className={`flex items-start gap-1 rounded-xl border p-2 transition-colors ${
                  active
                    ? 'border-brand-500/50 bg-brand-500/5'
                    : 'border-transparent hover:border-surface hover:bg-hover-surface dark:hover:border-surface'
                }`}
              >
                <button
                  type="button"
                  onClick={() => openConversation(conversation)}
                  aria-pressed={active}
                  className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-elevated">
                    <img src={conversation.carImage} alt="" className="h-full w-full object-cover" />
                    {conversation.unread > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-surface" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-1">
                      <span className={`truncate text-xs ${conversation.unread ? 'font-bold text-app-primary dark:text-app-primary' : 'font-semibold text-app-primary dark:text-app-primary'}`}>
                        {conversation.ownerName}
                      </span>
                      <span className="flex-shrink-0 text-[11px] text-app-muted">{formatTime(conversation.lastUpdated)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-app-muted">{conversation.carTitle}</span>
                    <span className={`mt-1 block truncate text-xs ${conversation.unread ? 'font-medium text-app-secondary dark:text-app-secondary' : 'text-app-muted'}`}>
                      {lastMessage
                        ? `${lastMessage.sender === 'me' ? 'Ti: ' : ''}${lastMessage.text}`
                        : 'Još nema poruka'}
                    </span>
                    <span className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-brand-text">
                      <ArrowLeftRight size={12} className="flex-shrink-0" />
                      <span className="truncate">{conversation.tradeSummary}</span>
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(conversation)}
                  aria-label={`Arhiviraj razgovor sa ${conversation.ownerName}`}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-tone-negative-surface hover:text-tone-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Archive size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );

  if (authReady && !isLoggedIn) {
    return (
      <SignedOutPage
        heading="Poruke"
        title="Poruke traže nalog"
        description="Prijavi se da vidiš razgovore o zameni i nastaviš dogovor sa vlasnicima."
        reason="Prijavi se da otvoriš poruke"
      />
    );
  }

  if (!mounted || !authReady) {
    return (
      <div className="flex flex-col">
        <header className="app-page-header safe-top">
          <div className="app-container py-4">
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Poruke</h1>
          </div>
        </header>
        <div className="app-container space-y-3 pt-6">
          <div className="h-20 animate-pulse rounded-2xl bg-card-surface dark:bg-card-surface" />
          <div className="h-20 animate-pulse rounded-2xl bg-card-surface dark:bg-card-surface" />
          <div className="h-20 animate-pulse rounded-2xl bg-card-surface dark:bg-card-surface" />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- CHAT */
  if (activeConv) {
    return (
      <>
        <div className="hidden desktop:block app-container py-6">
          <div className="grid h-[calc(100dvh-11rem)] min-h-[500px] max-h-[820px] grid-cols-[minmax(300px,340px)_minmax(0,1fr)] gap-4">
            {desktopConversationList}
            <ConversationThread
              conversation={activeConv}
              contact={activeContact}
              input={input}
              onInputChange={setInput}
              sending={sending}
              onSend={() => void handleSend()}
              onArchive={() => setPendingDelete(activeConv)}
              scrollRef={desktopScrollRef}
            />
          </div>
        </div>

        <div className="desktop:hidden">
          <ConversationThread
            conversation={activeConv}
            contact={activeContact}
            input={input}
            onInputChange={setInput}
            sending={sending}
            onSend={() => void handleSend()}
            onArchive={() => setPendingDelete(activeConv)}
            scrollRef={mobileScrollRef}
            fullScreen
            onBack={() => setActiveId(null)}
          />
        </div>

        {deleteDialog}
      </>
    );
  }

  /* ------------------------------------------------------------ INBOX */
  return (
    <>
    <div className="hidden desktop:block app-container py-6">
      <div className="grid h-[calc(100dvh-11rem)] min-h-[500px] max-h-[820px] grid-cols-[minmax(300px,340px)_minmax(0,1fr)] gap-4">
        {desktopConversationList}
        <section className="flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border border-dashed border-surface bg-card-surface px-8 text-center dark:border-surface dark:bg-card-surface">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-brand-text">
            <MessageCircle size={26} />
          </div>
          <h2 className="text-lg font-semibold text-app-primary dark:text-app-primary">
            {conversations.length > 0 ? 'Izaberi razgovor' : 'Tvoj sledeći dogovor počinje ovde'}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-app-muted">
            {conversations.length > 0
              ? 'Izaberi razgovor sa leve strane da nastaviš dogovor o zameni.'
              : 'Pošalji ponudu za zamenu i ovde ćeš razgovarati sa vlasnikom.'}
          </p>
          {conversations.length === 0 && (
            <Link href="/" className="btn-primary mt-5 text-sm">
              <ArrowLeftRight size={16} />
              Pronađi zamenu
            </Link>
          )}
        </section>
      </div>
    </div>

    <div className="desktop:hidden flex flex-col">
      <header className="app-page-header safe-top">
        <div className="app-container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Poruke</h1>
            <p className="mt-0.5 text-xs text-app-muted">
              {conversations.length === 0
                ? 'Razgovori o zameni'
                : `${conversations.length} ${conversations.length === 1 ? 'razgovor' : 'razgovora'}`}
            </p>
          </div>
          {totalUnread > 0 && (
            <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-on-accent">
              <span className="text-xs font-bold text-white">{totalUnread}</span>
            </div>
          )}
        </div>
      </header>

      <div className="app-container space-y-2 pb-4 pt-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-elevated/60">
              <MessageCircle size={36} className="text-app-muted" />
            </div>
            <p className="text-base font-semibold text-app-secondary dark:text-app-secondary">Nema razgovora</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-app-muted">
              Pošalji ponudu za trampu sa Početne da započneš razgovor sa drugim vlasnicima.
            </p>
            <Link
              href="/"
              className="btn-primary mt-6 text-sm"
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
                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-surface dark:border-surface bg-card-surface dark:bg-card-surface p-3 transition-all duration-200 hover:bg-hover-surface"
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
                      <p className="truncate text-sm font-bold text-app-primary dark:text-app-primary">{conv.ownerName}</p>
                      <span className="flex-shrink-0 text-[11px] text-app-muted">
                        {formatTime(conv.lastUpdated)}
                      </span>
                    </div>
                    <p className="mb-1 truncate text-xs text-app-muted">{conv.carTitle}</p>
                    <p
                      className={`min-w-0 truncate text-xs ${
                        conv.unread > 0 ? 'font-medium text-app-primary dark:text-app-primary' : 'text-app-muted'
                      }`}
                    >
                      {lastMsg
                        ? (lastMsg.sender === 'me' ? 'Ti: ' : '') + lastMsg.text
                        : 'Još nema poruka'}
                    </p>
                    <span className="mt-1.5 inline-block max-w-full whitespace-normal break-words rounded-lg bg-brand-500/10 px-2 py-1 text-[11px] font-semibold leading-snug text-brand-text">
                      {conv.tradeSummary}
                    </span>
                  </div>
                </button>

                <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
                  {conv.unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-on-accent">
                      {conv.unread}
                    </span>
                  )}
                  <button
                    onClick={() => setPendingDelete(conv)}
                    aria-label={`Arhiviraj razgovor sa ${conv.ownerName}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-tone-negative-surface hover:text-tone-negative"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
    {deleteDialog}
    </>
  );
}

