// app/api/claude/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- System Prompt: instruct JSON-only output (no tools / no prose)
const systemPrompt = `
You are an interviewing-prep analyst.

Only use the provided inputs: resume_text, job_description (optional),
evidence[] (Parallel search results), and company_insights (optional).
Do NOT fetch data or use external tools.

Return ONE valid JSON object ONLY.
- No code fences
- No Markdown
- No extra text or commentary

The JSON must include:
- "what_to_expect": { summary, rounds[], topic_weights[], timeline_hint, difficulty, confidence (0..1), source_ids[] }
- "top_questions": exactly 5 items, each with { question, category, rationale, how_to_prepare[], predicted_difficulty, evaluation_criteria[], source_ids[] }
- "company_insights_out": { one_liner, products[], tech_stack[], recent_news_or_ships[], culture_themes[], role_specific_context, reading_list[{title,url,source_id|null}], confidence (0..1), source_ids[] }

Rules:
- Cite evidence by filling source_ids with IDs from the evidence array when available.
- If a field lacks support, use "unknown" or "insufficient_evidence".
- Be concise and factual.
`;

function extractJsonFromText(s: string) {
  // Strip code fences if model ignored instructions
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : s.trim();

  // Try direct parse
  try {
    return JSON.parse(raw);
  } catch {}

  // Fallback: grab the first {...} block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = raw.slice(start, end + 1);
    return JSON.parse(slice);
  }
  throw new Error("Claude did not return valid JSON.");
}

export async function POST(req: NextRequest) {
  try {
    // 1) Load latest resume/content (your existing Supabase pattern)
    const supa = supabaseAdmin();
    const { data: documents, error: dbError } = await supa
      .from("documents")
      .select("id, content, created_at, jobUrl, interviewerName")
      .order("created_at", { ascending: false })
      .limit(1);

    if (dbError) {
      console.error("Error fetching document from Supabase:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch resume data" },
        { status: 500 }
      );
    }
    if (!documents?.length) {
      return NextResponse.json(
        { error: "No documents found in database" },
        { status: 404 }
      );
    }

    const {
      content: resumeContent,
      jobUrl = "",
      interviewerName = "",
    } = documents[0] ?? {};
    if (!resumeContent) {
      return NextResponse.json(
        { error: "No resume content found in database" },
        { status: 404 }
      );
    }

    // 2) Request body from client (Parallel results + optional fields)
    const body = await req.json();
    const {
      parallelResults = [], // results from your /api/parallel
      company_insights = null, // optional
      job_description = "", // optional if you have it
      company_name = "", // optional
      role_title = "", // optional
    } = body || {};

    // 3) Normalize Parallel evidence to a standard shape for the model
    const evidenceArray = Array.isArray(parallelResults?.results)
      ? parallelResults.results
      : Array.isArray(parallelResults)
      ? parallelResults
      : [];

    const normalizedEvidence = evidenceArray.map((e: any, i: number) => ({
      id: String(e.id ?? `e${i + 1}`),
      title: e.title ?? e.sourceTitle ?? "Unknown",
      url: e.url ?? e.link ?? null,
      excerpt: e.excerpt ?? e.text ?? e.content ?? "",
      source_type: e.source_type ?? e.provider ?? "other",
      retrieved_at: e.retrieved_at ?? null,
    }));

    // 4) Build the user payload Claude will see
    const userPayload = {
      company_name,
      role_title,
      resume_text: resumeContent,
      job_description,
      job_url: jobUrl,
      interviewer_name: interviewerName,
      evidence: normalizedEvidence,
      company_insights,
    };

    // 5) Call Anthropic SDK (NOT the Agent SDK) — no tools available
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const msg = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      temperature: 0,
      max_tokens: 2000, // keep responses bounded
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: JSON.stringify(userPayload) }],
        },
      ],
      // NOTE: Some SDK versions support: response_format: { type: "json" }
      // We're not relying on it to avoid type errors across versions.
    });

    // 6) Parse the model response as JSON
    // If your SDK/version returns a JSON block type when instructed, handle it:
    const first = msg.content?.[0] as any;
    let jsonOut: any;

    if (first?.type === "json" && first?.json) {
      jsonOut = first.json;
    } else if (first?.type === "text" && typeof first.text === "string") {
      jsonOut = extractJsonFromText(first.text);
    } else {
      // Fallback: try to merge any text blocks into one string and parse
      const whole = msg.content
        .map((b: any) => (b?.type === "text" ? b.text : ""))
        .join("\n");
      jsonOut = extractJsonFromText(whole);
    }

    return NextResponse.json(jsonOut, { status: 200 });
  } catch (err) {
    console.error("Error in /api/claude:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
