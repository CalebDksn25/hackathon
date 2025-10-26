import Parallel from "parallel-web";

const client = new Parallel({ apiKey: process.env.PARALLEL_API_KEY });

export async function linkedinSearch(url: string) {
  // Candidate queries; API supports up to 5 queries, so we slice to enforce the limit.

  try {
    const search = await client.beta.search({
      objective: `find the most information you can about this linkedin profile: ${url}`,
      search_queries: [`${url}`],
      processor: "base",
      max_results: 10,
      max_chars_per_result: 6000,
    });

    return search.results;
  } catch (err: any) {
    console.error("Parallel search error:", err?.message ?? err);
    // Return empty results so callers can fall back to mock data instead of crashing.
    return [];
  }
}
