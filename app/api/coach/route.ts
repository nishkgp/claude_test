import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { buildSystemPrompt, parseAuthorshipTags, detectPhaseTransition } from '@/lib/prompts';
import type { CoachRequest, CitationResult } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Citation verification via Semantic Scholar ────────────────────────────────
async function checkCitation(query: string): Promise<CitationResult> {
  try {
    const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
    url.searchParams.set('query', query);
    url.searchParams.set('limit', '1');
    url.searchParams.set('fields', 'title,authors,year,citationCount,isOpenAccess');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'ResearchCoach/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { query, found: false };

    const data = await res.json();
    const paper = data.data?.[0];

    if (!paper) return { query, found: false };

    return {
      query,
      found: true,
      title: paper.title,
      authors: paper.authors?.map((a: { name: string }) => a.name) ?? [],
      year: paper.year,
      citationCount: paper.citationCount,
      isOpenAccess: paper.isOpenAccess,
    };
  } catch {
    return { query, found: false };
  }
}

// ─── POST /api/coach ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body: CoachRequest = await req.json();
  const { messages, phase, citationQuery } = body;

  // Build system prompt for current phase
  const systemPrompt = buildSystemPrompt(phase);

  // Handle the __INIT__ trigger — replace with a real prompt for the first message
  const normalizedMessages = messages.map(m =>
    m.content === '__INIT__'
      ? { role: m.role, content: 'Hello, I\'m ready to start my research session.' }
      : m
  );

  // Optionally check citation first (runs in parallel with nothing else, fast enough)
  let citation: CitationResult | undefined;
  if (citationQuery?.trim()) {
    citation = await checkCitation(citationQuery.trim());
  }

  // Inject citation context into the last user message if we have a result
  let enrichedMessages = normalizedMessages;
  if (citation) {
    const citationContext = citation.found
      ? `\n\n[SYSTEM NOTE — Citation check result for "${citation.query}": FOUND — Title: "${citation.title}", Authors: ${citation.authors?.join(', ')}, Year: ${citation.year}, Citations: ${citation.citationCount}, Open Access: ${citation.isOpenAccess}. Use this to ask better questions about the source. Do not announce that you verified it.]`
      : `\n\n[SYSTEM NOTE — Citation check result for "${citation.query}": NOT FOUND in Semantic Scholar. Raise this with the student — ask them to double-check the source details.]`;

    enrichedMessages = messages.map((m, i) =>
      i === messages.length - 1 && m.role === 'user'
        ? { ...m, content: m.content + citationContext }
        : m
    );
  }

  // Stream Claude's response
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: enrichedMessages,
  });

  // Return a streaming response the client can consume chunk by chunk
  const encoder = new TextEncoder();
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        // After stream completes, send a metadata frame
        const { cleanedText, studentOutputs } = parseAuthorshipTags(fullText);
        const newPhase = detectPhaseTransition(cleanedText, phase);

        const meta = JSON.stringify({
          __meta: true,
          newPhase,
          studentOutputs,
          citation: citation ?? null,
        });
        controller.enqueue(encoder.encode(`\n\n__META__${meta}`));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Accel-Buffering': 'no',
      'Cache-Control': 'no-cache',
    },
  });
}
