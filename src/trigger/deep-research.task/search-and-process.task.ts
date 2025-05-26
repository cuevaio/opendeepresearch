import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

import { evaluateSearchResult } from "./evaluate-search-result.task";
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

		for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			// Perform the search
			const searchResult = await searchWeb.triggerAndWait({ query });

			if (!searchResult.ok || !searchResult.output) {
				continue;
			}

			// Evaluate the search result
			const evaluationResult = await evaluateSearchResult.triggerAndWait({
				query,
				searchResult: searchResult.output,
				accumulatedSources,
			});

			if (!evaluationResult.ok) {
				continue;
			}

			// If the result is relevant, return it immediately
			if (evaluationResult.output) {
				return searchResult.output;
			}
		}

		// If we've exhausted all attempts without finding a relevant result
		return null;
	},
});
