import type { Phase, StudentOutputType } from '@/lib/prompts';

export type { Phase, StudentOutputType };

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface AuthorshipEntry {
  id: string;
  type: StudentOutputType;
  content: string;
  phase: Phase;
  timestamp: number;
}

export interface CitationResult {
  query: string;
  found: boolean;
  title?: string;
  authors?: string[];
  year?: number;
  citationCount?: number;
  isOpenAccess?: boolean;
}

export interface CoachRequest {
  messages: { role: MessageRole; content: string }[];
  phase: Phase;
  citationQuery?: string;
}

export interface CoachResponse {
  text: string;
  newPhase: Phase | null;
  studentOutputs: { type: StudentOutputType; content: string }[];
  citation?: CitationResult;
}
