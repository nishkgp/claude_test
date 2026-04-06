'use client';

import type { AuthorshipEntry, Phase } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  research_question: 'Research Question',
  source_evaluation: 'Source Evaluation',
  hypothesis:        'Hypothesis',
  claim:             'Claim',
  other:             'Student Output',
};

const PHASE_LABELS: Record<Phase, string> = {
  onboarding:          'Onboarding',
  question_refinement: 'Question Refinement',
  literature_review:   'Literature Review',
  complete:            'Complete',
};

interface Props {
  entries: AuthorshipEntry[];
}

export default function AuthorshipLog({ entries }: Props) {
  const handleExport = () => {
    const lines = [
      '# Authorship Transparency Log',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      ...entries.map((e, i) => [
        `## ${i + 1}. ${TYPE_LABELS[e.type] ?? 'Student Output'}`,
        `Phase: ${PHASE_LABELS[e.phase]}`,
        `Time: ${new Date(e.timestamp).toLocaleTimeString()}`,
        `Author: STUDENT`,
        '',
        e.content,
        '',
      ].join('\n')),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'authorship-log.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Authorship Log
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            What the student wrote
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleExport}
            className="text-xs px-2 py-1 rounded border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            Export ↓
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Student outputs will appear here as you progress.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg p-3 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Type badge */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--student)' }}
                >
                  {TYPE_LABELS[entry.type] ?? 'Student Output'}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {PHASE_LABELS[entry.phase]}
                </span>
              </div>

              {/* Content */}
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {entry.content}
              </p>

              {/* Timestamp */}
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer trust badge */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
          🔒 Only student-authored content is logged here. AI coaching messages are not included.
        </p>
      </div>
    </div>
  );
}
