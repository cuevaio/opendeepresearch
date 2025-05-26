import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

import { exa } from "@/lib/exa";
import type { SearchResult } from "./types";

export const searchWeb = schemaTask({
	id: "search-web",
	schema: z.object({
		query: z.string(),
	}),
	async run({ query }) {
		const { results } = await exa.searchAndContents(query, {
			livecrawl: "always",
			numResults: 1,
		});

		return {
			title: results[0].title,
			url: results[0].url,
			content: results[0].text,
			faviconUrl: results[0].favicon ?? null,
		} satisfies SearchResult;
	},
});
