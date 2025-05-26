import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";

import { SearchResultSchema } from "./types";

export const evaluateSearchResult = schemaTask({
	id: "evaluate-search-result",
	schema: z.object({
		query: z.string(),
		searchResult: SearchResultSchema,
		accumulatedSources: z.array(SearchResultSchema),
	}),
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 15_000,
		maxTimeoutInMs: 60_000,
		randomize: false,
	},
	async run({ query, searchResult, accumulatedSources }) {
		const { object } = await generateObject({
			model: openai("gpt-4.1"),
			prompt: `Evaluate whether the search result is relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant. If the result is not relevant, provide an alternative query that might be more relevant.

			<search_result>
			${JSON.stringify(searchResult)}
			</search_result>

			<existing_results>
			${JSON.stringify(accumulatedSources.map((result) => result.url))}
			</existing_results>
			`,
			schema: z.object({
				relevant: z.boolean(),
				alternative_query: z.string().optional(),
			}),
		});

		return object;
	},
});
