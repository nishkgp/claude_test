# PRD: Research Coach

## Problem

US high school students preparing research papers and science fair projects face a $3,000–$7,000+ barrier to get effective mentorship. Programs like Pioneer Academics and Polygence work — graduate mentors guide students through the full research workflow — but they're expensive, slow to match, and bottlenecked by mentor supply. The students who need this most (first-generation, under-resourced schools) are the least likely to access it.

Existing AI tools make this worse, not better. Students use ChatGPT to generate outlines, draft paragraphs, and suggest research questions. The output is polished but hollow — the student learns nothing, and the work isn't theirs. Teachers and admissions readers increasingly know the difference.

## User

**Primary:** US high school juniors and seniors working on AP Research papers, ISEF science fair projects, or independent research for college applications. Academically motivated, time-constrained, often without access to a university network or research-experienced adults.

**Secondary:** Parents, teachers, and admissions officers who need to verify that the work is authentically the student's.

## Pain Point

The core problem is not access to information — it's access to guided thinking. A Google search can surface 10,000 papers. What students can't get for free is someone asking "what does this paper actually claim?" and "how would you test that?" until they can answer it themselves. That cognitive scaffolding is what the $5,000 mentorship programs sell, and it's what AI has so far failed to provide.

## Market Wedge

**Entry point: question refinement.** Every research project starts with a vague topic and needs to become a specific, testable question. This is universally hard, it's the step where most students get stuck, and it's purely pedagogical — there's no shortcut, no paste-able answer. Socratic coaching is the right tool and it's the natural demo: the student arrives with "I want to research social media" and leaves with "To what extent does daily Instagram use above 3 hours correlate with self-reported sleep quality in 14-17 year olds?" That before/after is visible and compelling to every stakeholder.

This wedge also avoids the ghostwriting trap. Competitors (Chegg, Course Hero, generic ChatGPT) generate content. Research Coach refuses to. That refusal is the product.

## MVP Scope

**Phase 1 (this prototype):**
- Socratic coaching through question refinement
- Literature source evaluation with real citation verification (Semantic Scholar)
- Authorship transparency log — exportable record of student-produced outputs
- No accounts, no persistence — single session

**Phase 2:**
- Session persistence and multi-session memory (student resumes where they left off)
- Experiment design scaffolding (computational and observational)
- Rubric-based draft feedback (AP Research, ISEF criteria)
- Teacher/parent view of authorship log

**Phase 3:**
- Institutional licensing (schools, districts)
- Mentor network integration (human escalation for complex projects)
- Portfolio export for college applications

## Sequencing Rationale

Start narrow and hard. Question refinement is the highest-leverage, lowest-risk phase to nail: it's short enough to demo in 10 minutes, it has a clear success criterion (the student produces a testable question), and it requires zero content generation from the AI. Proving Socratic coaching works here unlocks trust for every downstream phase. Literature review follows naturally and adds citation verification — a concrete, technical differentiator that shows the product takes source integrity seriously.

Accounts and persistence are deliberately deferred. The insight is that the value lives in the coaching session, not the platform. Prove the session works first.
