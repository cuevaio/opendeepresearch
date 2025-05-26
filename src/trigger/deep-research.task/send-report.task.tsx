import { render } from "@react-email/render";
import { schemaTask } from "@trigger.dev/sdk/v3";
import z from "zod";

import { ReportEmailTemplate } from "@/email";
import { resend } from "@/lib/resend";

export const sendReport = schemaTask({
	id: "send-report",
	schema: z.object({
		query: z.string(),
		report: z.string(),
		email: z.string(),
	}),
	async run({ query, report, email }) {
		const { error } = await resend.emails.send({
			from: "Open Deep Research <hello@reports.opendeepresearch.io>",
			to: email,
			subject: `Open Deep Research Report for ${query}`,
			html: await render(<ReportEmailTemplate report={report} />),
		});

		if (error) {
			throw new Error(error.message);
		}
	},
});
