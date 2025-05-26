import { Markdown } from "@react-email/components";
import type * as React from "react";

interface ReportEmailTemplateProps {
	report: string;
}

export const ReportEmailTemplate: React.FC<
	Readonly<ReportEmailTemplateProps>
> = ({ report }) => <Markdown>{report}</Markdown>;
