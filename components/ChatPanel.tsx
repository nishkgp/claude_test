'use client';

import { useRef, useEffect, useState } from 'react';
import type { ChatMessage, Phase } from '@/types';

interface Props {
  messages: ChatMessage[];
  phase: Phase;
  isLoading: boolean;
  onSend: (text: string, citationQuery?: string) => void;
}

// Detect if a user message is likely mentioning a citation
// Simple heuristic: looks for year patterns or "et al" or quoted titles
function extractCitationQuery(text: string): string | undefined {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const hasEtAl   = /et al/i.test(text);
  const hasQuotes  = /"[^"]{10,}"/.test(text);

  if ((yearMatch && hasEtAl) || hasQuotes) {
    // Return up to first 120 chars as the search query (Semantic Scholar handles natural language)
    return text.slice(0, 120);
  }
  return undefined;
}

export default function ChatPanel({ messages, phase, isLoading, onSend }: Props) {
  const [input, setInput] = useState('');
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const citationQuery = phase === 'literature_review' ? extractCitationQuery(text) : undefined;
    onSend(text, citationQuery);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Phase badge */}
      <div
        className="px-6 py-3 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--accent-lt)' }}
        >
          {PHASE_DISPLAY[phase]}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          Shift+Enter for new line · Enter to send
        </span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <Avatar role="assistant" />
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[80%]"
              style={{ background: 'var(--surface)', color: 'var(--muted)' }}
            >
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex items-end gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your response…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:opacity-40"
            style={{ color: 'var(--text)', maxHeight: '160px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7H13M7 1L13 7L7 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const PHASE_DISPLAY: Record<Phase, string> = {
  onboarding:          'Getting Started',
  question_refinement: 'Refining Your Question',
  literature_review:   'Literature Review',
  complete:            'Session Complete',
};

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
      style={{
        background: role === 'assistant' ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.25)',
        color: role === 'assistant' ? 'var(--ai)' : 'var(--student)',
      }}
    >
      {role === 'assistant' ? 'RC' : 'You'}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-3 items-start ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <Avatar role={message.role} />
      <div
        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap ${
          isAssistant ? 'rounded-tl-sm' : 'rounded-tr-sm'
        }`}
        style={{
          background: isAssistant ? 'var(--surface)' : 'rgba(124,58,237,0.18)',
          color: 'var(--text)',
          border: `1px solid ${isAssistant ? 'var(--border)' : 'rgba(124,58,237,0.3)'}`,
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
