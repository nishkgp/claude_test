/**
 * PROMPT ASSEMBLER
 *
 * Combines base + phase addendum into the final system message sent to Claude.
 * Also exports helpers for parsing authorship tags from Claude's response.
 */

import { BASE_SYSTEM_PROMPT } from './base';
import {
  Phase,
  ONBOARDING_PROMPT,
  QUESTION_REFINEMENT_PROMPT,
  LITERATURE_REVIEW_PROMPT,
  COMPLETE_PROMPT,
} from './phases';

export type { Phase };

const PHASE_PROMPTS: Record<Phase, string> = {
  onboarding: ONBOARDING_PROMPT,
  question_refinement: QUESTION_REFINEMENT_PROMPT,
  literature_review: LITERATURE_REVIEW_PROMPT,
  complete: COMPLETE_PROMPT,
};

/**
 * Assembles the full system prompt for a given phase.
 * Inject this as the `system` parameter in every Claude API call.
 */
export function buildSystemPrompt(phase: Phase): string {
  return `${BASE_SYSTEM_PROMPT}\n\n${PHASE_PROMPTS[phase]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHORSHIP TAG PARSING
//
// Claude is instructed to emit tags like:
//   <student_output type="research_question">...</student_output>
//
// These must be stripped from the displayed response but captured for the log.
// ─────────────────────────────────────────────────────────────────────────────

export type StudentOutputType =
  | 'research_question'
  | 'source_evaluation'
  | 'hypothesis'
  | 'claim'
  | 'other';

export interface StudentOutput {
  type: StudentOutputType;
  content: string;
}

const OUTPUT_TAG_RE =
  /<student_output\s+type="([^"]+)">([\s\S]*?)<\/student_output>/g;

/**
 * Extracts all student_output tags from Claude's raw response.
 * Returns the cleaned response text (tags removed) and the captured outputs.
 */
export function parseAuthorshipTags(rawResponse: string): {
  cleanedText: string;
  studentOutputs: StudentOutput[];
} {
  const studentOutputs: StudentOutput[] = [];

  const cleanedText = rawResponse.replace(OUTPUT_TAG_RE, (_match, type, content) => {
    studentOutputs.push({
      type: type as StudentOutputType,
      content: content.trim(),
    });
    return ''; // remove tag from displayed text
  }).trim();

  return { cleanedText, studentOutputs };
}

/**
 * Detects if the AI response signals a phase transition.
 * Claude is prompted to use specific language when advancing phases.
 * This is a lightweight heuristic — replace with explicit JSON signaling if needed.
 */
export function detectPhaseTransition(
  cleanedText: string,
  currentPhase: Phase
): Phase | null {
  const text = cleanedText.toLowerCase();

  if (currentPhase === 'onboarding') {
    // Coach explicitly moves to question refinement
    if (text.includes("let's move to") || text.includes("let's work on your question")) {
      return 'question_refinement';
    }
  }

  if (currentPhase === 'question_refinement') {
    // Coach confirms a strong question and moves to literature
    if (
      text.includes("let's move to literature") ||
      text.includes("move to the next phase") ||
      text.includes("log that as your first output")
    ) {
      return 'literature_review';
    }
  }

  if (currentPhase === 'literature_review') {
    // Coach signals session complete
    if (
      text.includes("you've completed") ||
      text.includes("that's a strong foundation") ||
      text.includes("session complete")
    ) {
      return 'complete';
    }
  }

  return null; // no transition detected
}
