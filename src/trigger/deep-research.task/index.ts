import { logger, metadata, schemaTask } from "@trigger.dev/sdk/v3";
import z from "zod";

import { generateLearnings } from "./generate-learnings.task";
import { generateReport } from "./generate-report";
import { generateSearchQueries } from "./generate-search-queries.task";
import { searchAndProcess } from "./search-and-process.task";
import { sendReport } from "./send-report.task";

import type { Research } from "./types";

export const deepResearch = schemaTask({
	id: "deep-research",
	schema: z.object({
		prompt: z.string(),
		email: z.string().optional().default("hi@cueva.io"),
		depth: z.number().optional().default(2),
		breadth: z.number().optional().default(3),
	}),
	async run({ prompt, depth, breadth, email }) {
		const accumulatedResearch: Research = {
			query: undefined,
			queries: [],
			searchResults: [],
			learnings: [],
			completedQueries: [],
		};

		const doDeepResearch = async (prompt: string, depth = 3, breadth = 2) => {
			if (!accumulatedResearch.query) {
				accumulatedResearch.query = prompt;
			}

			if (depth === 0) {
				return accumulatedResearch;
			}

			const queriesResult = await generateSearchQueries.triggerAndWait({
				query: prompt,
				n: breadth,
			});

			if (!queriesResult.ok) {
				throw new Error("Failed to generate search queries");
			}
			const queries = queriesResult.output;
			accumulatedResearch.queries = queries;

			for (const query of queries) {
				logger.info("Searching the web", { query });
				const searchResults = await searchAndProcess.triggerAndWait({
					query,
					accumulatedSources: accumulatedResearch.searchResults,
				});
				if (!searchResults.ok) {
					throw new Error("Failed to search the web");
				}
				accumulatedResearch.searchResults.push(...searchResults.output);
				for (const searchResult of searchResults.output) {
					logger.info("Processing search result", { url: searchResult.url });
					const learningsResult = await generateLearnings.triggerAndWait({
						query,
						searchResult,
						breadth,
					});
					if (!learningsResult.ok) {
						throw new Error("Failed to generate learnings");
					}
					metadata.append("status", {
						type: "learning",
						learning: learningsResult.output.learning,
					});
					accumulatedResearch.learnings.push(learningsResult.output);
					accumulatedResearch.completedQueries.push(query);

					const newQuery = `Overall research goal: ${prompt}
        Previous search queries: ${accumulatedResearch.completedQueries.join(", ")}

        Follow-up questions: ${learningsResult.output.followUpQuestions.join(", ")}
        `;
					await doDeepResearch(newQuery, depth - 1, Math.ceil(breadth / 2));
				}
			}
			return accumulatedResearch;
		};

		const research = await doDeepResearch(prompt, depth, breadth);

		logger.info("Research completed!");

		logger.info("Generating report");
		const reportResult = await generateReport.triggerAndWait({ research });
		logger.info("Report generated");

		if (!reportResult.ok) {
			throw new Error("Failed to generate report");
		}

		const report = reportResult.output;

		logger.info("Sending report", { email });
		await sendReport.triggerAndWait({
			query: prompt,
			report,
			email,
		});
		logger.info("Report sent", { email });
	},
});
