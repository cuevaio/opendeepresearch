import { openai } from "@ai-sdk/openai";
import { logger, metadata, schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject, generateText, tool } from "ai";
import { z } from "zod";

import { searchWeb } from "./search-web.task";
import { type RunStatus, type SearchResult, SearchResultSchema } from "./types";

export const searchAndProcess = schemaTask({
	id: "search-and-process",
	schema: z.object({
		query: z.string(),
		accumulatedSources: z.array(SearchResultSchema),
	}),
	async run({ query, accumulatedSources }) {
		const pendingSearchResults: SearchResult[] = [];
		const finalSearchResults: SearchResult[] = [];

		function updateStatus(status: RunStatus) {
			logger.info(`Updating status: ${JSON.stringify(status)}`);

			metadata.root.append("status_root", status);
			metadata.parent.append("status_parent", status);
			metadata.append("status", status);
		}

		updateStatus({
			type: "searching-web",
			query,
		});

		await generateText({
			model: openai("gpt-4o"),
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
						updateStatus({
							type: "searching-web",
							query,
						});
						const result = await searchWeb.triggerAndWait({ query });

						if (result.ok) {
							updateStatus({
								type: "search-result",
								searchResult: {
									title: result.output.title,
									url: result.output.url,
									faviconUrl: result.output.faviconUrl,
								},
							});

							pendingSearchResults.push(result.output);

							return result.output;
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
							model: openai("gpt-4o"),
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

						updateStatus({
							type: "irrelevant-search-result",
							searchResult: {
								title: pendingResult.title,
								url: pendingResult.url,
								faviconUrl: pendingResult.faviconUrl,
							},
						});

						return "Search results are irrelevant. Please search again with a more specific query.";
					},
				}),
			},
			experimental_telemetry: {
				isEnabled: true,
				functionId: "search-and-process",
			},
		});
		return finalSearchResults;
	},
});
