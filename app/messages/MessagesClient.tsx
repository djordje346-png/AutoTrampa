"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type RefObject,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useOffers } from "@/hooks/use-offers";
import { OffersInbox } from "@/components/OffersInbox";
import { BottomSheet } from "@/components/BottomSheet";
import { offerStatus, type TradeOffer } from "@/lib/trade-offers";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Check,
  Phone,
  Archive,
  ArrowLeftRight,
  Search,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useMessages } from "@/hooks/use-messages";
import type { ChatMessage, Conversation } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { useContactPhone } from "@/hooks/use-contact-phone";
import { contactPhoneMessage } from "@/lib/contact-phone";
import { SignedOutPage } from "@/components/SignedOut";

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `${mins}m`;
  return "sada";
}

function formatMessageTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("sr-Latn-RS", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Danas";
  if (sameDay(date, yesterday)) return "Juče";
  return date.toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long" });
}

function MessageHistory({
  messages,
  scrollRef,
}: {
  messages: ChatMessage[];
  scrollRef: RefObject<HTMLDivElement>;
}) {
  let lastDay = "";

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-elevated">
            <MessageCircle size={26} className="text-app-muted" />
          </div>
          <p className="text-sm font-medium text-app-secondary dark:text-app-secondary">
            Još nema poruka
          </p>
          <p className="mt-1 text-xs text-app-muted">
            Pošalji prvu poruku ispod
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          const day = formatDayLabel(msg.timestamp);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = msg.sender === "me";

          return (
            <div key={msg.id}>
              {showDay && (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full bg-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-app-muted">
                    {day}
                  </span>
                </div>
              )}
              {msg.sender === "system" ? (
                <div className="flex justify-center">
                  <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-center text-xs leading-relaxed text-app-secondary dark:text-app-secondary">
                    <p className="font-semibold text-brand-text">{msg.text}</p>
                    <span className="mt-1 block text-[10px] text-app-muted">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                      mine
                        ? "rounded-br-md bg-brand-500 text-on-accent"
                        : "rounded-bl-md bg-elevated text-app-primary dark:text-app-primary"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                      {msg.text}
                    </p>
                    <div
                      className={`mt-1 flex items-center gap-1 ${mine ? "justify-end text-primary-foreground/60" : "text-app-muted"}`}
                    >
                      <span className="text-[10px]">
                        {formatMessageTime(msg.timestamp)}
                      </span>
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
  offer,
  onOffer,
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
  offer?: TradeOffer;
  onOffer?: () => void;
  fullScreen?: boolean;
  onBack?: () => void;
}) {
  const contactNote =
    contact.status === "hidden"
      ? "Broj telefona je privatan. Nastavite dogovor porukama."
      : contactPhoneMessage(contact.status);

  async function handleCall() {
    const current = await contact.dial();
    const message = contactPhoneMessage(current.status);
    if (message) toast.message(message);
  }

  return (
    <section
      aria-label={`Razgovor sa ${conversation.ownerName}`}
      className={
        fullScreen
          ? "fixed inset-0 z-[60] flex flex-col bg-app dark:bg-app"
          : "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-surface bg-card-surface shadow-sm dark:border-surface dark:bg-card-surface"
      }
    >
      <header
        className={`flex flex-shrink-0 items-center gap-3 border-b border-surface px-4 py-3 dark:border-surface ${fullScreen ? "safe-top" : ""}`}
      >
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
          <img
            src={conversation.carImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-app-primary dark:text-app-primary">
            {conversation.ownerName}
          </p>
          <p className="truncate text-xs text-app-muted">
            {conversation.carTitle}
          </p>
          {conversation.hasMatch && (
            <p className="mt-1 text-[10px] font-semibold text-brand-text">
              Obostrano interesovanje
            </p>
          )}
        </div>

        {contact.href ? (
          <a
            href={contact.href}
            onClick={(event) => {
              event.preventDefault();
              void handleCall();
            }}
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">
            {offer ? "Ponuda za zamenu" : "Razgovor o vozilu"}
          </p>
          <p className="truncate text-sm font-semibold text-app-primary dark:text-app-primary">
            {offer
              ? `Doplata po dogovoru · ${offerStatus(offer)}`
              : "Doplata i uslovi po dogovoru"}
          </p>
        </div>
        {offer && onOffer ? (
          <button
            onClick={onOffer}
            className="min-h-[44px] shrink-0 rounded-lg px-2 text-xs font-semibold text-brand-text hover:bg-brand-500/10"
          >
            Pogledaj ponudu
          </button>
        ) : (
          <Link
            href={`/car/${conversation.carId}`}
            className="flex min-h-[44px] shrink-0 items-center rounded-lg px-2 text-xs font-semibold text-brand-text hover:bg-brand-500/10"
          >
            Oglas
          </Link>
        )}
      </div>

      {contactNote && (
        <p
          className="mx-4 mt-2 flex-shrink-0 text-[11px] leading-relaxed text-app-muted"
          role="status"
        >
          {contactNote}
        </p>
      )}

      <MessageHistory messages={conversation.messages} scrollRef={scrollRef} />

      <div
        className={`flex flex-shrink-0 items-center gap-2 border-t border-surface bg-app px-4 py-3 dark:border-surface dark:bg-app ${fullScreen ? "safe-bottom" : ""}`}
      >
        <input
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
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
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") === "offers" ? "offers" : "conversations";
  const activeId = params.get("conversation");
  const offerId = params.get("offer");
  const {
    conversations,
    sendMessage,
    markRead,
    deleteConversation,
    totalUnread,
    mounted,
    error,
    refresh,
  } = useMessages({ poll: true });
  const {
    offers,
    unread: offerUnread,
    mounted: offersReady,
    error: offerError,
    refresh: refreshOffers,
    updateOffer,
    openConversation: openOfferConversation,
  } = useOffers({ poll: true });
  const { isLoggedIn, userId, mounted: authReady } = useAuth();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const sendingRef = useRef(false);
  const currentConversation = useRef(activeId);
  currentConversation.current = activeId;
  const [pendingArchive, setPendingArchive] = useState<Conversation | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const active = conversations.find((item) => item.id === activeId) ?? null;
  const contact = useContactPhone(
    active ? { conversationId: active.id } : null,
  );
  const activeOffer = offers.find(
    (offer) => offer.conversation_id === activeId,
  );
  const filtered = conversations.filter((item) =>
    `${item.ownerName} ${item.carTitle}`
      .toLocaleLowerCase("sr")
      .includes(search.toLocaleLowerCase("sr")),
  );

  useEffect(() => {
    setInput("");
  }, [activeId, userId]);
  const unreadConversationId = active && active.unread > 0 ? active.id : null;
  useEffect(() => {
    if (unreadConversationId) void markRead(unreadConversationId);
  }, [unreadConversationId, markRead]);
  useEffect(() => {
    for (const element of [scrollRef.current, mobileScrollRef.current])
      if (element) element.scrollTop = element.scrollHeight;
  }, [active?.messages.length, activeId]);
  useEffect(() => {
    if (!activeId || tab !== "conversations") return;
    const media = window.matchMedia("(min-width: 1200px)");
    const previous = document.body.style.overflow;
    const sync = () => {
      document.body.style.overflow = media.matches ? previous : "hidden";
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      document.body.style.overflow = previous;
    };
  }, [activeId, tab]);
  const readOffer = useCallback(
    (id: string) => {
      void updateOffer(id, "read");
    },
    [updateOffer],
  );

  function navigateConversation(id: string | null) {
    router.push(id ? `/messages?conversation=${id}` : "/messages", {
      scroll: false,
    });
  }
  async function handleSend() {
    const text = input.trim();
    const id = activeId;
    if (!text || !id || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    const ok = await sendMessage(id, text);
    sendingRef.current = false;
    setSending(false);
    if (!ok) {
      toast.error("Poruka nije poslata. Proveri vezu i pokušaj ponovo.");
      return;
    }
    if (currentConversation.current === id) setInput("");
  }
  async function handleOfferMessage(offer: TradeOffer) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const result = await openOfferConversation(offer.id);
    if (result.ok) {
      await refresh();
      navigateConversation(result.id);
    } else toast.error(result.message);
    busyRef.current = false;
    setBusy(false);
  }
  async function handleOfferAction(
    offer: TradeOffer,
    action: "decline" | "withdraw",
  ) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const result = await updateOffer(offer.id, action);
    if (!result.ok) toast.error(result.message);
    else
      toast.success(
        action === "decline" ? "Ponuda je odbijena." : "Ponuda je povučena.",
      );
    busyRef.current = false;
    setBusy(false);
  }
  async function archive() {
    if (!pendingArchive || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const ok = await deleteConversation(pendingArchive.id);
    if (ok) {
      if (activeId === pendingArchive.id) navigateConversation(null);
      setPendingArchive(null);
      toast.success("Razgovor je arhiviran.");
    } else toast.error("Razgovor nije arhiviran. Pokušaj ponovo.");
    busyRef.current = false;
    setBusy(false);
  }
  if (authReady && !isLoggedIn)
    return (
      <SignedOutPage
        heading="Poruke i ponude"
        title="Tvoje ponude i razgovori"
        description="Prijavi se da vidiš ponude za svoje automobile i razgovaraš sa vlasnicima."
        reason="Prijavi se da otvoriš poruke i ponude"
      />
    );
  const ready = authReady && (tab === "offers" ? offersReady : mounted);
  const currentError = tab === "offers" ? offerError : error;
  return (
    <section className="pb-6">
      <header className="app-page-header safe-top">
        <div className="app-container pt-5">
          <h1 className="app-page-title-accent font-heading text-2xl font-bold tracking-tight text-app-primary sm:text-3xl">
            Poruke i ponude
          </h1>
          <p className="mt-2 text-sm text-app-secondary">
            Ponude za automobile i dogovori sa vlasnicima.
          </p>
          <nav
            aria-label="Poruke i ponude"
            className="mt-5 flex gap-5 sm:gap-8"
          >
            {[
              {
                value: "conversations",
                label: "Razgovori",
                icon: MessageCircle,
                count: totalUnread,
              },
              {
                value: "offers",
                label: "Ponude",
                icon: ArrowLeftRight,
                count: offerUnread,
              },
            ].map(({ value, label, icon: Icon, count }) => (
              <Link
                key={value}
                href={value === "offers" ? "/messages?tab=offers" : "/messages"}
                aria-current={tab === value ? "page" : undefined}
                className={`flex min-h-[48px] items-center gap-2 border-b-[3px] px-1 text-sm font-semibold transition-colors sm:text-base ${tab === value ? "border-brand-500 text-app-primary" : "border-transparent text-app-muted hover:text-app-primary"}`}
              >
                <Icon size={19} aria-hidden="true" />
                {label}
                {count > 0 && (
                  <span
                    aria-label={`Novih: ${count}`}
                    className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-on-accent"
                  >
                    {count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="app-container pt-5">
        {currentError && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface bg-elevated p-4 text-sm text-app-primary"
          >
            <p>{currentError}</p>
            <button
              onClick={() =>
                void (tab === "offers" ? refreshOffers() : refresh())
              }
              className="min-h-[44px] px-3 font-semibold text-brand-text"
            >
              Pokušaj ponovo
            </button>
          </div>
        )}
        {!ready ? (
          <div
            role="status"
            aria-label="Učitavanje"
            className="h-80 animate-pulse rounded-2xl bg-card-surface"
          />
        ) : tab === "offers" && userId ? (
          <OffersInbox
            offers={offers}
            userId={userId}
            selectedId={offerId}
            onSelect={(id) =>
              router.replace(
                id
                  ? `/messages?tab=offers&offer=${id}`
                  : "/messages?tab=offers",
                { scroll: false },
              )
            }
            onAction={handleOfferAction}
            onMessage={handleOfferMessage}
            onRead={readOffer}
            busy={busy}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface bg-card-surface desktop:grid desktop:h-[calc(100dvh-19rem)] desktop:min-h-[520px] desktop:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)]">
            <aside
              aria-label="Razgovori"
              className="min-h-0 overflow-y-auto border-surface desktop:border-r"
            >
              <label className="m-4 flex items-center gap-2 rounded-xl border border-surface bg-elevated px-3">
                <Search size={17} className="shrink-0 text-app-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pretraži razgovore"
                  aria-label="Pretraži razgovore"
                  className="min-h-[44px] w-full min-w-0 bg-transparent text-sm text-app-primary outline-none placeholder:text-app-muted"
                />
              </label>
              {!filtered.length ? (
                <div className="px-6 py-14 text-center">
                  <MessageCircle
                    size={30}
                    className="mx-auto mb-4 text-app-muted"
                  />
                  <h2 className="font-semibold text-app-primary">
                    {search ? "Nema rezultata pretrage" : "Još nema razgovora"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-app-muted">
                    {search
                      ? "Pokušaj sa drugim imenom ili automobilom."
                      : "Otvori primljenu ponudu ili pošalji poruku sa oglasa."}
                  </p>
                  {!search && (
                    <Link
                      href="/messages?tab=offers"
                      className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-text"
                    >
                      <Inbox size={17} />
                      Pogledaj ponude
                    </Link>
                  )}
                </div>
              ) : (
                filtered.map((item) => {
                  const last = item.messages[item.messages.length - 1];
                  return (
                    <div
                      key={item.id}
                      className={`flex border-b border-surface last:border-b-0 ${activeId === item.id ? "bg-brand-500/10" : "hover:bg-hover-surface"}`}
                    >
                      <button
                        onClick={() => navigateConversation(item.id)}
                        aria-pressed={activeId === item.id}
                        className="flex min-w-0 flex-1 gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                      >
                        <span className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-elevated">
                          {item.carImage && (
                            <img
                              src={item.carImage}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-app-primary">
                              {item.ownerName}
                            </span>
                            <time className="text-[11px] text-app-muted">
                              {formatTime(item.lastUpdated)}
                            </time>
                          </span>
                          <span className="mt-1 block truncate text-xs text-app-muted">
                            {item.carTitle}
                          </span>
                          <span
                            className={`mt-1 block truncate text-xs ${item.unread ? "font-semibold text-app-primary" : "text-app-secondary"}`}
                          >
                            {last
                              ? `${last.sender === "me" ? "Ti: " : ""}${last.text}`
                              : item.hasMatch
                                ? "Obostrano interesovanje"
                                : "Započni razgovor"}
                          </span>
                          {item.unread > 0 && (
                            <span className="mt-2 inline-block rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-on-accent">
                              Novih: {item.unread}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        onClick={() => setPendingArchive(item)}
                        aria-label={`Arhiviraj razgovor sa ${item.ownerName}`}
                        className="my-2 mr-1 flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-app-muted hover:bg-elevated"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </aside>
            <div className="hidden min-h-0 desktop:block">
              {active ? (
                <ConversationThread
                  conversation={active}
                  contact={contact}
                  input={input}
                  onInputChange={setInput}
                  sending={sending}
                  onSend={() => void handleSend()}
                  onArchive={() => setPendingArchive(active)}
                  scrollRef={scrollRef}
                  offer={activeOffer}
                  onOffer={
                    activeOffer
                      ? () =>
                          router.push(
                            `/messages?tab=offers&offer=${activeOffer.id}`,
                          )
                      : undefined
                  }
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
                  <MessageCircle size={34} className="mb-4 text-app-muted" />
                  <h2 className="text-lg font-semibold text-app-primary">
                    {activeId ? "Razgovor nije dostupan" : "Izaberi razgovor"}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-app-muted">
                    {activeId
                      ? "Razgovor je možda arhiviran ili vozilo više nije dostupno."
                      : "Ovde dogovarate doplatu, pregled vozila i ostale detalje zamene."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {tab === "conversations" && active && (
        <div className="desktop:hidden">
          <ConversationThread
            conversation={active}
            contact={contact}
            input={input}
            onInputChange={setInput}
            sending={sending}
            onSend={() => void handleSend()}
            onArchive={() => setPendingArchive(active)}
            scrollRef={mobileScrollRef}
            fullScreen
            onBack={() => navigateConversation(null)}
            offer={activeOffer}
            onOffer={
              activeOffer
                ? () =>
                    router.push(`/messages?tab=offers&offer=${activeOffer.id}`)
                : undefined
            }
          />
        </div>
      )}
      <BottomSheet
        open={Boolean(pendingArchive)}
        onClose={() => {
          if (!busy) setPendingArchive(null);
        }}
        title="Arhivirati razgovor?"
      >
        <p className="text-sm leading-relaxed text-app-secondary">
          Razgovor sa {pendingArchive?.ownerName} biće sakriven samo sa tvog
          naloga. Ponude ostaju sačuvane.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            disabled={busy}
            onClick={() => setPendingArchive(null)}
            className="min-h-[44px] flex-1 rounded-xl bg-elevated text-sm font-semibold text-app-primary"
          >
            Odustani
          </button>
          <button
            disabled={busy}
            onClick={() => void archive()}
            className="btn-primary flex-1 text-sm disabled:opacity-60"
          >
            {busy ? "Arhiviram…" : "Arhiviraj"}
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}
