# TDD: Research Coach

## Architecture Overview

Single Next.js 14 app (App Router). No external database — session state lives in React client memory. One API route handles all coaching interactions. All graphics and assets are inline; the only external calls are to Anthropic and Semantic Scholar.

```
Client (React)                    Server (Next.js API route)
─────────────────                 ──────────────────────────────
page.tsx                          /api/coach
 ├─ phase state                    ├─ buildSystemPrompt(phase)
 ├─ messages[]                     ├─ Claude streaming call
 ├─ authorshipLog[]                ├─ Semantic Scholar lookup
 └─ streams response ────────────► └─ emits text + __META__ frame
      ├─ renders chunks live
      └─ parses meta on completion
           ├─ newPhase → setState
           └─ studentOutputs → log
```

## Key Architecture Decisions

**Streaming with a metadata frame.** Claude's response is streamed to the client for perceived responsiveness. Authorship tags and phase transitions are embedded in the raw response as XML tags (`<student_output type="...">`), stripped from display text server-side, and sent as a JSON `__META__` frame appended at the end of the stream. This avoids a second round-trip and keeps the API surface to a single endpoint.

**Phase state machine on the client, not server.** Phase transitions are detected from Claude's language by a lightweight heuristic (`detectPhaseTransition`) and reported back via the meta frame. The client owns phase state. This keeps the API stateless and makes the session trivially resumable — phase is just a value in React state, serializable to `localStorage` when persistence is added.

**System prompt split into base + phase addenda.** The base prompt contains identity, hard prohibitions, and the Socratic ladder — these never change. Phase-specific addenda contain coaching moves, failure patterns, and advancement criteria. `buildSystemPrompt(phase)` concatenates them. This made iteration fast: changing the literature review phase didn't require touching the Socratic core.

**Citation verification as a hidden system note.** When the client detects a citation pattern in the user's message (year + "et al", or quoted title), it passes a `citationQuery` to the API. The server checks Semantic Scholar and injects the result as a `[SYSTEM NOTE]` appended to the user message before Claude sees it. Claude is instructed how to use the result (ask better questions on FOUND, raise doubt on NOT FOUND) without announcing the check. The student experiences natural coaching, not a verification UI.

## Coaching Pattern Implementation

The core prompt engineering problem is enforcing Socratic behavior reliably. The solution has three layers:

**1. Explicit prohibition list.** The system prompt names every ghostwriting form individually: writing a research question, suggesting sources by name, summarizing papers, completing sentences, offering "example" questions. Vague rules like "don't write for them" are insufficient — Claude finds the edges. Named prohibitions close them.

**2. Ghostwrite redirection pattern.** Rather than a hard refusal, Claude is given a three-step redirect: acknowledge the feeling (stuck, overwhelmed), explain why the refusal is for the student, give the smallest possible next step. This keeps the coaching relationship warm under the constraint.

**3. Single-question rule.** Claude is instructed to ask exactly one question per message. Stacking three questions lets students dodge by answering the easiest one. One question forces engagement with the real issue.

## Authorship Tracking

Claude emits `<student_output type="research_question">...</student_output>` tags when the student produces a meaningful output. The `parseAuthorshipTags()` function extracts these from the raw response, strips them from the displayed text, and returns them as structured objects. Each entry is stored in the client's `authorshipLog` state with type, phase, and timestamp. The log is rendered in the right sidebar and exportable as a Markdown file.

The authorship signal is student-produced content captured at the moment of production — not post-hoc AI labeling of a document. This distinction matters for trust: the log can show that a research question was produced in session 3, after 14 exchanges, with no prior AI-generated version.

**What the log does not capture:** the student's private thinking, drafts they typed and deleted, or outputs from sessions without the tool. This is a meaningful limitation for full authorship claims.

## What I'd Change With More Time

**Session persistence.** Currently all state is in-memory. Adding `localStorage` would survive page refresh; a proper DB (Postgres via Prisma) would enable multi-session continuity and teacher/parent access. The state shape is already serializable — this is a thin layer away.

**Explicit phase signaling from Claude.** The current phase transition detection is a string heuristic on Claude's output. It works but is brittle. A better approach: ask Claude to emit a structured `<phase_transition to="literature_review"/>` tag that the system processes unambiguously, the same way authorship tags work.

**Rubric-based draft feedback.** The AP Research and ISEF rubrics are public and structured. A dedicated phase where the student submits a draft section and Claude gives rubric-referenced feedback (again, through questions, not rewrites) would close the loop on the full research workflow.

**Sandboxed code execution.** For computational experiments, the prototype would need a sandboxed Python environment. The coaching pattern extends naturally — "run this, tell me what you observe" — but the infrastructure (e.g. E2B, Modal) wasn't in scope for this prototype.

**Adversarial prompt testing.** The Socratic constraints need systematic red-teaming: students asking in different languages, using indirect phrasing ("not that you'd write it for me, but what would a good question look like"), multi-turn jailbreak attempts. The prompt is solid but untested against a determined adversary.
