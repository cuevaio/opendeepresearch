import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject, generateText, tool } from "ai";
import { z } from "zod";

import { searchWeb } from "./search-web.task";
import { type SearchResult, SearchResultSchema } from "./types";

export const searchAndProcess = schemaTask({
	id: "search-and-process",
	schema: z.object({
		query: z.string(),
		accumulatedSources: z.array(SearchResultSchema),
	}),
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 500,
		maxTimeoutInMs: 30_000,
		randomize: false,
	},
	async run({ query, accumulatedSources }) {
		const pendingSearchResults: SearchResult[] = [];
		const finalSearchResults: SearchResult[] = [];

		await generateText({
			model: openai("gpt-4.1"),
			prompt: `Search the web for information about ${query}`,
			system:
				"You are a researcher. For each query, search the web and then evaluate if the results are relevant and will help answer the following query",
			maxSteps: 5,
			tools: {
				searchWeb: tool({
					description: "Search the web for information about a given query",
					parameters: z.object({
						query: z.string().min(1),
					}),
					async execute({ query }) {
						const result = await searchWeb.triggerAndWait({ query });

						if (result.ok) {
							if (result.output) {
								pendingSearchResults.push(result.output);

								return result.output;
							}
							return "No search results found.";
						}
						return "No search results found.";
					},
				}),
				evaluate: tool({
					description: "Evaluate the search results",
					parameters: z.object({}),
					async execute() {
						const pendingResult = pendingSearchResults.pop();
						if (!pendingResult) {
							return "No more search results to evaluate.";
						}
						const { object: evaluation } = await generateObject({
							model: openai("gpt-4.1"),
							prompt: `Evaluate whether the search results are relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant.

            <search_results>
            ${JSON.stringify(pendingResult)}
            </search_results>

            <existing_results>
            ${JSON.stringify(accumulatedSources.map((result) => result.url))}
            </existing_results>

            `,
							output: "enum",
							enum: ["relevant", "irrelevant"],
						});
						if (evaluation === "relevant") {
							finalSearchResults.push(pendingResult);
							return "Search results are relevant. End research for this query.";
						}

						return "Search results are irrelevant. Please search again with a more specific query.";
					},
				}),
			},
			experimental_telemetry: {
				isEnabled: true,
				functionId: "search-and-process",
			},
		});
		return finalSearchResults.length > 0 ? finalSearchResults[0] : null;
	},
});
