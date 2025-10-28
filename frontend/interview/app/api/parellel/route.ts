import Parallel from "parallel-web";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { companyName, jobUrl, interviewerName } = await request.json();

    if (!companyName || !jobUrl || !interviewerName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Get the API key from environment variables
    const apiKey = process.env.PARALLEL_API_KEY;

    if (!apiKey) {
      console.error("PARALLEL_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const client = new Parallel({ apiKey });

    console.log("--- Calling Parallel Search API ---");
    console.log("Company:", companyName);
    console.log("Job URL:", jobUrl);
    console.log("Interviewer:", interviewerName);

    const search = await client.beta.search({
      objective:
        "Find the general interview process and questions for the given role and the company values that they look for when hiring. Prefer sources from peer websites. Look through the job description at this URL " +
        jobUrl,
      search_queries: [
        jobUrl,
        interviewerName + " interviewing",
        "Reddit and Glassdoor company reviews",
      ],
      processor: "base",
      max_results: 10,
      max_chars_per_result: 6000,
    });
    // --- 3. Send Results Back to Frontend ---
    console.log(
      "Search completed. Results count:",
      search.results?.length || 0
    );
    return NextResponse.json(search.results || []); // Send back the results array
  } catch (error) {
    console.error("Error calling Parallel Search API:", error);

    // Log the full error details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Send detailed error message to the frontend
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to perform search", details: errorMessage },
      { status: 500 }
    );
  }
}
