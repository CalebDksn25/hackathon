import Parallel from "parallel-web";

const client = new Parallel({ apiKey: process.env.PARALLEL_API_KEY });

export default async function parallelCompanySearch(company: string) {
  // Candidate queries; API supports up to 5 queries, so we slice to enforce the limit.
  const candidateQueries = [
    `${company} software engineer intern interview process`,
    `${company} software engineer intern interview questions`,
    `${company} software engineer intern interview tips`,
    `${company} coding interview questions`,
    `${company} behavioral interview questions`,
    `${company} glassdoor`,
  ];

  const queries = candidateQueries.slice(0, 5);

  try {
    const search = await client.beta.search({
      objective: `Find the interview process, common questions, and preparation tips for Software Engineer intern interviews at ${company}. Prefer sources from Reddit, Glassdoor, Blind, and ${company}’s engineering blog.`,
      search_queries: queries,
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
// export async function linkedinSearch(url: string) {
//   // Candidate queries; API supports up to 5 queries, so we slice to enforce the limit.

//   try {
//     const search = await client.beta.search({
//       objective: `find the most information you can about this linkedin profile: ${url}`,
//       search_queries: [`${url}`],
//       processor: "base",
//       max_results: 10,
//       max_chars_per_result: 6000,
//     });

//     return search.results;
//   } catch (err: any) {
//     console.error("Parallel search error:", err?.message ?? err);
//     // Return empty results so callers can fall back to mock data instead of crashing.
//     return [];
//   }
// }
