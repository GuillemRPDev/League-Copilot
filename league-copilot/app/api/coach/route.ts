import { NextRequest, NextResponse } from "next/server";

import { buildCoachPrompt, type MatchMetrics } from "@/lib/metrics";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { matches?: MatchMetrics[] };
    const matches = body.matches ?? [];

    if (!matches.length) {
      return NextResponse.json({ error: "At least one match metric is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: buildCoachPrompt(matches),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude request failed: ${response.status} ${errorText}`);
    }

    const json = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const text = json.content?.find((part) => part.type === "text")?.text ?? "No feedback generated.";

    return NextResponse.json({ feedback: text.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
