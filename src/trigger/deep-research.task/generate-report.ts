import { openai } from "@ai-sdk/openai";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { z } from "zod";

import { ResearchSchema } from "./types";

const SYSTEM_PROMPT = `You are an expert researcher. Today is ${new Date().toISOString()}. Follow these instructions when responding:
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.
  - Use Markdown formatting.`;

export const generateReport = schemaTask({
	id: "generate-report",
	schema: z.object({
		research: ResearchSchema,
	}),
	async run({ research }) {
		const { text } = await generateText({
			model: openai("o3-mini"),
			system: SYSTEM_PROMPT,
			prompt: `Generate a report based on the following research data:
      ${JSON.stringify(research, null, 2)}`,
			experimental_telemetry: {
				isEnabled: true,
				functionId: "generate-report",
			},
		});
		return text;
	},
});
