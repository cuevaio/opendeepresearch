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
		emails: z.array(z.string().email()),
	}),
	async run({ query, report, emails }) {
		const { error } = await resend.emails.send({
			from: "Open Deep Research <hello@reports.opendeepresearch.io>",
			to: emails,
			subject: `Open Deep Research Report for ${query}`,
			html: await render(<ReportEmailTemplate report={report} />),
		});

		if (error) {
			throw new Error(error.message);
		}
	},
});
