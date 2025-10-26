import Parallel from "parallel-web";

const client = new Parallel({ apiKey: "PARALLEL_API_KEY" });

const search = await client.beta.search({
  objective:
    "Find the interview process, common questions, and preparation tips for Backend Software Engineer interviews at Stripe. Prefer sources from Reddit, Glassdoor, Blind, and Stripe’s engineering blog.",
  search_queries: ["Founding year UN", "Year of founding United Nations"],
  processor: "base",
  max_results: 10,
  max_chars_per_result: 6000,
});

console.log(search.results);
