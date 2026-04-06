'use client';

import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import PhaseIndicator from '@/components/PhaseIndicator';
import ChatPanel     from '@/components/ChatPanel';
import AuthorshipLog from '@/components/AuthorshipLog';
import type { ChatMessage, AuthorshipEntry, Phase, StudentOutputType } from '@/types';

const META_MARKER = '\n\n__META__';

export default function Home() {
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [phase,         setPhase]         = useState<Phase>('onboarding');
  const [authorshipLog, setAuthorshipLog] = useState<AuthorshipEntry[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [started,       setStarted]       = useState(false);

  const sendMessage = useCallback(async (text: string, citationQuery?: string) => {
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id:        uuid(),
      role:      'user',
      content:   text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build messages array for API (no system prompt — that's server-side)
    const apiMessages = [...messages, userMsg].map(m => ({
      role:    m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/coach', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: apiMessages, phase, citationQuery }),
      });

      if (!res.ok || !res.body) throw new Error('API error');

      // Stream response
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   raw     = '';

      const assistantId = uuid();

      // Add placeholder message
      setMessages(prev => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });

        // Split off meta if it arrived
        const metaIdx = raw.indexOf(META_MARKER);
        const display = metaIdx === -1 ? raw : raw.slice(0, metaIdx);

        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: display.trim() } : m)
        );
      }

      // Parse meta frame
      const metaIdx = raw.indexOf(META_MARKER);
      if (metaIdx !== -1) {
        try {
          const metaJson = raw.slice(metaIdx + META_MARKER.length);
          const meta = JSON.parse(metaJson) as {
            __meta: true;
            newPhase: Phase | null;
            studentOutputs: { type: StudentOutputType; content: string }[];
            citation: unknown;
          };

          if (meta.newPhase) setPhase(meta.newPhase);

          if (meta.studentOutputs.length > 0) {
            const entries: AuthorshipEntry[] = meta.studentOutputs.map(o => ({
              id:        uuid(),
              type:      o.type,
              content:   o.content,
              phase,
              timestamp: Date.now(),
            }));
            setAuthorshipLog(prev => [...prev, ...entries]);
          }
        } catch {
          // meta parse failure — non-critical, continue
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id:        uuid(),
          role:      'assistant',
          content:   'Something went wrong. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, phase]);

  const handleStart = () => {
    setStarted(true);
    // Trigger the first coach message automatically
    sendMessage('__INIT__');
  };

  // Landing screen
  if (!started) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6">
          <h1
            className="text-4xl font-bold tracking-tight mb-3"
            style={{ color: 'var(--text)' }}
          >
            Research Coach
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            A Socratic mentor that guides you through the craft of research —
            question refinement, literature evaluation, and beyond.
            It asks. You think. You write.
          </p>
        </div>

        <div
          className="rounded-xl border p-5 max-w-sm w-full text-left mb-8 space-y-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            How it works
          </p>
          {[
            ['💬', 'You share your topic area'],
            ['🔍', 'Coach asks questions to sharpen your research question'],
            ['📚', 'You find and evaluate real sources'],
            ['📋', 'Every output you write is logged with full authorship transparency'],
          ].map(([icon, label]) => (
            <div key={label} className="flex gap-3 items-start">
              <span className="text-lg">{icon}</span>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Start Research Session →
        </button>
      </div>
    );
  }

  // Main 3-panel layout
  return (
    <div className="h-full flex" style={{ borderColor: 'var(--border)' }}>
      {/* Left: phase stepper */}
      <div
        className="w-48 flex-shrink-0 border-r hidden md:block"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Research Coach</p>
        </div>
        <PhaseIndicator currentPhase={phase} />
      </div>

      {/* Center: chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatPanel
          messages={messages.filter(m => m.content !== '' && m.content !== '__INIT__')}
          phase={phase}
          isLoading={isLoading}
          onSend={sendMessage}
        />
      </div>

      {/* Right: authorship log */}
      <div
        className="w-72 flex-shrink-0 border-l hidden lg:flex flex-col"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <AuthorshipLog entries={authorshipLog} />
      </div>
    </div>
  );
}
