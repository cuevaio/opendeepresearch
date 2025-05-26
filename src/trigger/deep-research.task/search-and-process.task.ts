import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

import { evaluateSearchResult } from "./evaluate-search-result.task";
import { generateAlternativeQuery } from "./generate-alternative-query.task";
import { searchWeb } from "./search-web.task";
import { SearchResultSchema } from "./types";

export const searchAndProcess = schemaTask({
	id: "search-and-process",
	schema: z.object({
		query: z.string(),
		accumulatedSources: z.array(SearchResultSchema),
	}),
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 15_000,
		maxTimeoutInMs: 60_000,
		randomize: false,
	},
	async run({ query, accumulatedSources }) {
		const MAX_ATTEMPTS = 3;

		let searchQuery = query;

		for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			// Perform the search
			const searchResult = await searchWeb.triggerAndWait({
				query: searchQuery,
			});

			if (!searchResult.ok) {
				throw new Error("Failed to search the web");
			}

			// Generate an alternative query if no results were found
			if (!searchResult.output) {
				const alternativeQueryResult =
					await generateAlternativeQuery.triggerAndWait({
						originalQuery: searchQuery,
					});

				if (!alternativeQueryResult.ok) {
					throw new Error("Failed to generate an alternative query");
				}

				searchQuery = alternativeQueryResult.output.alternative_query;
			} else {
				// Evaluate the search result
				const evaluationResult = await evaluateSearchResult.triggerAndWait({
					query: searchQuery,
					searchResult: searchResult.output,
					accumulatedSources,
				});

				if (!evaluationResult.ok) {
					throw new Error("Failed to evaluate the search result");
				}

				// If the result is relevant, return it immediately
				if (evaluationResult.output.relevant) {
					return searchResult.output;
				}

				searchQuery = evaluationResult.output.alternative_query ?? query;
			}
		}

		// If we've exhausted all attempts without finding a relevant result
		return null;
	},
});
