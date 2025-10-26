// app/api/agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "child_process";

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

    const { prompt } = await req.json();
    const chunks: string[] = [];

    const stream = query({
      prompt: prompt ?? "Say hello from Claude.",
      options: {
        systemPrompt:
          "You are concise and factual. Keep answers to 5–8 sentences.",
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
