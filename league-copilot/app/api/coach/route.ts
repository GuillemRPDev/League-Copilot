import { NextRequest, NextResponse } from "next/server";

import { buildCoachPrompt, buildFallbackFeedback, type MatchMetrics } from "@/lib/metrics";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { matches?: MatchMetrics[] };
    const matches = body.matches ?? [];

    if (!matches.length) {
      return NextResponse.json({ error: "At least one match metric is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const ollamaUrl = process.env.OLLAMA_BASE_URL;
    const prompt = buildCoachPrompt(matches);

    if (!apiKey && !ollamaUrl) {
      return NextResponse.json({ feedback: buildFallbackFeedback(matches), provider: "metrics" });
    }

    const response = ollamaUrl
      ? await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL ?? "llama3.2:3b",
          prompt,
          stream: false,
        }),
      })
      : await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude request failed: ${response.status} ${errorText}`);
    }

    const json = (await response.json()) as {
      response?: string;
      content?: Array<{ type?: string; text?: string }>;
    };

    const text = ollamaUrl
      ? json.response ?? "No feedback generated."
      : json.content?.find((part) => part.type === "text")?.text ?? "No feedback generated.";

    return NextResponse.json({ feedback: text.trim(), provider: ollamaUrl ? "ollama" : "anthropic" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
