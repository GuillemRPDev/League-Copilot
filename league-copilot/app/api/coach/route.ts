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
    const ollamaUrl = process.env.OLLAMA_BASE_URL?.trim();
    const ollamaModel = process.env.OLLAMA_MODEL?.trim() || "llama3.2:3b";
    const prompt = buildCoachPrompt(matches);

    if (!apiKey && !ollamaUrl) {
      return NextResponse.json({ feedback: buildFallbackFeedback(matches), provider: "metrics" });
    }

    let response: Response;
    let provider: "ollama" | "anthropic";

    if (ollamaUrl) {
      provider = "ollama";

      try {
        response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          system: "Eres un coach experto de League of Legends, un MOBA. CS es el último golpe a súbditos enemigos. Da feedback breve, realista y en español; no confundas el farmeo del juego con agricultura.",
          prompt,
          stream: false,
          options: { temperature: 0.2, num_predict: 180 },
        }),
        });
      } catch {
        throw new Error("No se pudo conectar con Ollama. Comprueba que está ejecutándose y que OLLAMA_BASE_URL es correcto.");
      }
    } else {
      provider = "anthropic";
      response = await fetch("https://api.anthropic.com/v1/messages", {
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
    }

    if (!response.ok) {
      throw new Error(`${provider === "ollama" ? "Ollama" : "Anthropic"} request failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      response?: string;
      content?: Array<{ type?: string; text?: string }>;
    };

    const text = provider === "ollama"
      ? json.response ?? "No feedback generated."
      : json.content?.find((part) => part.type === "text")?.text ?? "No feedback generated.";

    return NextResponse.json({ feedback: text.trim(), provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
