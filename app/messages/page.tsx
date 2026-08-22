'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, ArrowLeft, Check, CheckCheck, Phone, MapPin } from 'lucide-react';
import { useMessages, Conversation } from '@/hooks/use-messages';

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `${mins}m`;
  return 'now';
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
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-white">Poruke</h1>
        </header>
        <div className="px-4 pt-6 space-y-3">
          <div className="h-20 bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-900 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Chat view
  if (activeConv) {
    return (
      <div className="flex flex-col h-screen">
        {/* Chat header */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setActiveId(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
            <img src={activeConv.carImage} alt={activeConv.carTitle} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{activeConv.ownerName}</p>
            <p className="text-xs text-slate-500 truncate">{activeConv.carTitle}</p>
          </div>
          <a
            href="tel:+381631234567"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Phone size={16} />
          </a>
        </header>

        {/* Trade summary banner */}
        <div className="mx-4 mt-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400">{activeConv.tradeSummary}</span>
          <span className="text-[10px] text-slate-500">Trade terms</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <MessageCircle size={26} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No messages yet</p>
              <p className="text-slate-600 text-xs mt-1">Send the first message below</p>
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
                      ? 'bg-amber-500 text-slate-950 rounded-br-md'
                      : 'bg-slate-800 text-slate-100 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-snug">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'text-slate-800/70' : 'text-slate-500'}`}>
                    <span className="text-[9px]">{formatMessageTime(msg.timestamp)}</span>
                    {msg.sender === 'me' && <CheckCheck size={11} className="text-slate-700" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input bar */}
        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 transition-all duration-200 active:scale-90 flex-shrink-0"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Poruke</h1>
            <p className="text-xs text-slate-500 mt-0.5">Trade conversations</p>
          </div>
          {totalUnread > 0 && (
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{totalUnread}</span>
            </div>
          )}
        </div>
      </header>

      {/* Conversations list */}
      <div className="px-4 pt-4 pb-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-800/60 flex items-center justify-center mb-5">
              <MessageCircle size={36} className="text-slate-600" />
            </div>
            <p className="text-slate-300 font-semibold text-base">No conversations</p>
            <p className="text-slate-500 text-sm mt-2 max-w-xs leading-relaxed">
              Send a trade offer from the Feed to start chatting with other car owners.
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
                  className="w-full flex items-center gap-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-3 text-left transition-all duration-200"
                >
                  {/* Car thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 relative">
                    <img src={conv.carImage} alt={conv.carTitle} className="w-full h-full object-cover" />
                    {conv.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center border-2 border-slate-900">
                        <span className="text-[9px] font-bold text-white">{conv.unread}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-bold text-white truncate">{conv.ownerName}</p>
                      <span className="text-[10px] text-slate-600 flex-shrink-0">{formatTime(conv.lastUpdated)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1">{conv.carTitle}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${conv.unread > 0 ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
                        {lastMsg ? (lastMsg.sender === 'me' ? 'You: ' : '') + lastMsg.text : 'No messages yet'}
                      </p>
                      <span className="text-[10px] text-amber-400 font-semibold flex-shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-full">
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
