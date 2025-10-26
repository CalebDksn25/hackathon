// app/api/agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "child_process";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AgentEvent = { type?: string; content?: string };

export async function POST(req: NextRequest) {
  try {
    // Get the full path to node
    let nodePath = process.env.NODE || "/usr/local/bin/node";
    try {
      nodePath = execSync("which node", { encoding: "utf-8" }).trim();
    } catch {
      // Fallback to default
    }

    // Ensure PATH includes common node locations
    if (!process.env.PATH) {
      process.env.PATH = "/usr/local/bin:/usr/bin:/bin";
    } else if (!process.env.PATH.includes("/usr/local/bin")) {
      process.env.PATH = `/usr/local/bin:${process.env.PATH}`;
    }

    // Fetch the most recent document from Supabase
    const supa = supabaseAdmin();

    // Try to fetch with optional fields first
    let { data: documents, error: dbError } = await supa
      .from("documents")
      .select("id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (dbError) {
      console.error("Error fetching document from Supabase:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch resume data" },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: "No documents found in database" },
        { status: 404 }
      );
    }

    const resumeContent = documents[0].content || "";
    let jobUrl = "";
    let interviewerName = "";

    // Try to fetch the optional fields separately if they exist
    try {
      const docId = documents[0].id;
      const { data: docData } = await supa
        .from("documents")
        .select("jobUrl, interviewerName")
        .eq("id", docId)
        .single();

      jobUrl = docData?.jobUrl || "";
      interviewerName = docData?.interviewerName || "";
    } catch (e) {
      // Fields don't exist, that's okay
      console.log("Optional fields (jobUrl, interviewerName) not available");
    }

    if (!resumeContent) {
      return NextResponse.json(
        { error: "No resume content found in database" },
        { status: 404 }
      );
    }

    const { prompt } = await req.json();
    const chunks: string[] = [];

    const stream = query({
      prompt: `
        ${prompt ?? ""}
        
        Resume Data:
        ${resumeContent}
        
        Job URL: ${jobUrl || "Not provided"}
        Interviewer Name: ${interviewerName || "Not provided"}
      `,
      options: {
        systemPrompt: `
          You are an interviewing-prep analyst.
          You receive:
          - Parsed resume text describing the candidate's skills, projects, and experience.
          - Structured evidence from the Parallel AI Search/Task APIs (Reddit, Glassdoor, company blogs, news).
          - Optional company insights (products, tech stack, culture, interview format, recent news).
    
          Your only output must be a single valid JSON object, no extra text or formatting.
    
          The JSON must contain:
          - "what_to_expect": summary of likely interview format, topics, difficulty, timeline (grounded in evidence).
          - "top_questions": exactly 5 likely questions tailored to BOTH the role and the candidate's resume. Each question should include category, rationale, how_to_prepare, predicted_difficulty, evaluation_criteria, and source_ids.
          - "company_insights_out": a concise company brief with products, tech_stack, recent_news_or_ships, culture_themes, role_specific_context, and reading_list.
    
          Rules:
          - Use the resume text to align questions with the candidate's background (e.g., ask about skills/projects they mention, or test gaps vs. job requirements).
          - Ground all other content in provided evidence or company_insights. If unavailable, write "unknown" or "insufficient_evidence".
          - Include "source_ids" referencing the evidence you used.
          - Be concise and factual. Avoid fluff.
          - Return only the JSON object. Do not output explanations, Markdown, or extra commentary.
        `,
        env: {
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
          PATH: process.env.PATH,
        },
      },
    });

    for await (const raw of stream as AsyncIterable<unknown>) {
      console.log("Raw event:", JSON.stringify(raw));
      const msg = raw as any;
      console.log("Parsed msg type:", msg?.type);

      // Handle 'assistant' type events - check if there's content
      if (msg?.type === "assistant" && msg?.message?.content) {
        const content = msg.message.content;
        // Content can be an array of text items
        if (Array.isArray(content)) {
          for (const item of content) {
            if (item.type === "text" && typeof item.text === "string") {
              console.log("Adding chunk from assistant:", item.text);
              chunks.push(item.text);
            }
          }
        }
      }

      // Handle 'result' type events - contains final result text
      if (msg?.type === "result" && typeof msg?.result === "string") {
        console.log("Adding result chunk:", msg.result);
        chunks.push(msg.result);
      }
    }

    return NextResponse.json({ text: chunks.join("") }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in /api/search:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
