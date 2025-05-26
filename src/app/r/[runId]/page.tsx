"use client";

import React from "react";

import { useParams } from "next/navigation";

import { useRealtimeRun } from "@trigger.dev/react-hooks";

export default function Page() {
	const { runId } = useParams<{ runId: string }>();

	const [publicAccessToken, setPublicAccessToken] = React.useState<
		string | null
	>(null);

	React.useEffect(() => {
		const accessToken = localStorage.getItem(`publicAccessToken:${runId}`);
		if (accessToken) {
			setPublicAccessToken(accessToken);
		}
	}, [runId]);

	const { run, error } = useRealtimeRun(runId, {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		accessToken: publicAccessToken!,
		onComplete: (run, error) => {
			console.log("Run completed", run);
		},
		enabled: !!publicAccessToken,
	});

	return (
		<div>
			<pre>{JSON.stringify(run, null, 2)}</pre>
			<pre className="text-red-500">{JSON.stringify(error, null, 2)}</pre>
		</div>
	);
}
