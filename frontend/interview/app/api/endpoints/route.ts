import { NextResponse } from "next/server";
import parallelCompanySearch from "@/app/api/parellel/route";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, role } = body;

    if (!companyName || !role) {
      return NextResponse.json(
        { error: "Missing 'companyName' or 'role' in request body" },
        { status: 400 }
      );
    }

    // Step 1: Parallel search for company-specific interview info
    const searchResults = await parallelCompanySearch(companyName);
    const combinedText = searchResults
      .map((r: any) => r.content || r.text || "")
      .join("\n\n")
      .slice(0, 15000); // keep prompt under token limits

    // Step 2: Send to OpenAI for structured synthesis
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are ParallelPrep, an expert interview intelligence assistant.
Structure your entire response as valid JSON — no prose or explanation.`,
        },
        {
          role: "user",
          content: `
Using the search results below, synthesize a structured preparation brief for:
Company: ${companyName}
Role: ${role}

Search context:
${combinedText}

Follow this schema exactly:
{
  "interviewer": "(not set)",
  "company": {
    "name": "",
    "description": "",
    "coreValues": [],
    "recentNews": []
  },
  "whatToExpect": {
    "summary": "",
    "details": ""
  },
  "questions": [
    {
      "id": "",
      "question": "",
      "category": "",
      "why": "",
      "tips": "",
      "predictedDifficulty": "",
      "evaluationCriteria": "",
      "source_ids": []
    }
  ],
  "hiringSignals": {
    "glassdoorDifficulty": "",
    "averageLengthMinutes": 0,
    "behavioralFocusPercent": 0
  },
  "loadingSteps": [
    "Scanning company site",
    "Extracting common interview questions",
    "Analyzing your experience",
    "Preparing your mock interview…"
  ],
  "generatedAt": "${new Date().toISOString()}"
}
`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const data = completion.choices[0].message?.content;

    return NextResponse.json(JSON.parse(data ?? "{}"));
  } catch (err) {
    console.error("Error in interview-prep route:", err);
    return NextResponse.json(
      { error: "Failed to generate structured interview prep data" },
      { status: 500 }
    );
  }
}
