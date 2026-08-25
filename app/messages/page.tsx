'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, ArrowLeft, CheckCheck, Phone } from 'lucide-react';
import { useMessages, Conversation } from '@/hooks/use-messages';

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `${mins}m`;
  return 'sada';
}

function formatMessageTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function MessagesPage() {
  const { conversations, sendMessage, markRead, totalUnread, mounted } = useMessages();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeId) || null;

  useEffect(() => {
    if (activeConv && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages.length]);

  function openConversation(conv: Conversation) {
    setActiveId(conv.id);
    markRead(conv.id);
  }

  function handleSend() {
    if (!input.trim() || !activeId) return;
    sendMessage(activeId, input);
    setInput('');
  }

  if (!mounted) {
    return (
      <div className="flex flex-col">
        <header className="sticky top-0 z-40 bg-app/90 backdrop-blur-md border-b border-surface px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-app-primary">Poruke</h1>
        </header>
        <div className="px-4 pt-6 space-y-3">
          <div className="h-20 bg-card-surface rounded-2xl animate-pulse" />
          <div className="h-20 bg-card-surface rounded-2xl animate-pulse" />
          <div className="h-20 bg-card-surface rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (activeConv) {
    return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-40 bg-app/95 backdrop-blur-md border-b border-surface px-4 py-3 flex items-center gap-3 safe-top">
          <button
            onClick={() => setActiveId(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-elevated text-app-secondary hover:text-app-primary transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-elevated">
            <img src={activeConv.carImage} alt={activeConv.carTitle} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-app-primary truncate">{activeConv.ownerName}</p>
            <p className="text-xs text-app-muted truncate">{activeConv.carTitle}</p>
          </div>
          <a
            href="tel:+381631234567"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-elevated text-app-secondary hover:text-orange-400 transition-colors"
          >
            <Phone size={16} />
          </a>
        </header>

        <div className="mx-4 mt-3 rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-orange-400">{activeConv.tradeSummary}</span>
          <span className="text-[10px] text-app-muted">Uslovi zamene</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center mb-3">
                <MessageCircle size={26} className="text-app-muted" />
              </div>
              <p className="text-app-secondary text-sm font-medium">Još nema poruka</p>
              <p className="text-app-muted text-xs mt-1">Pošalji prvu poruku ispod</p>
            </div>
          ) : (
            activeConv.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                    msg.sender === 'me'
                      ? 'bg-orange-500 text-white rounded-br-md'
                      : 'bg-elevated text-app-primary rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-snug">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-app-muted'}`}>
                    <span className="text-[9px]">{formatMessageTime(msg.timestamp)}</span>
                    {msg.sender === 'me' && <CheckCheck size={11} className="text-white/80" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-0 bg-app/95 backdrop-blur-md border-t border-surface px-4 py-3 flex items-center gap-2 safe-bottom">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Napiši poruku..."
            className="flex-1 bg-elevated border border-surface rounded-full px-4 py-2.5 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200 active:scale-90 flex-shrink-0"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-app/90 backdrop-blur-md border-b border-surface px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary">Poruke</h1>
            <p className="text-xs text-app-muted mt-0.5">Razgovori o zameni</p>
          </div>
          {totalUnread > 0 && (
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{totalUnread}</span>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pt-4 pb-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-elevated/60 flex items-center justify-center mb-5">
              <MessageCircle size={36} className="text-app-muted" />
            </div>
            <p className="text-app-secondary font-semibold text-base">Nema razgovora</p>
            <p className="text-app-muted text-sm mt-2 max-w-xs leading-relaxed">
              Pošalji ponudu za trampu sa Početne da započneš razgovor sa drugim vlasnicima.
            </p>
          </div>
        ) : (
          conversations
            .slice()
            .sort((a, b) => b.lastUpdated - a.lastUpdated)
            .map(conv => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="w-full flex items-center gap-3 bg-card-surface hover:bg-hover-surface border border-surface rounded-2xl p-3 text-left transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-elevated relative">
                    <img src={conv.carImage} alt={conv.carTitle} className="w-full h-full object-cover" />
                    {conv.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center border-2 bg-card-surface">
                        <span className="text-[9px] font-bold text-white">{conv.unread}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-bold text-app-primary truncate">{conv.ownerName}</p>
                      <span className="text-[10px] text-app-muted flex-shrink-0">{formatTime(conv.lastUpdated)}</span>
                    </div>
                    <p className="text-xs text-app-muted truncate mb-1">{conv.carTitle}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${conv.unread > 0 ? 'text-app-primary font-medium' : 'text-app-muted'}`}>
                        {lastMsg ? (lastMsg.sender === 'me' ? 'Ti: ' : '') + lastMsg.text : 'Još nema poruka'}
                      </p>
                      <span className="text-[10px] text-orange-400 font-semibold flex-shrink-0 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        {conv.tradeSummary}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
        )}
      </div>
    </div>
  );
}
