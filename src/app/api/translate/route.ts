import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, provider, apiKey, model } = body;

    if (!text || !apiKey || !provider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let url = "";
    const modelName = model || "llama3.2";

    if (provider === "ollama-cloud") {
      url = "https://ollama.com/v1/chat/completions";
    } else if (provider === "openrouter") {
      url = "https://openrouter.ai/api/v1/chat/completions";
    } else if (provider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "http://localhost";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content: "You are a Bengali to English translator. Translate the following Bengali text to English accurately. Only respond with the translation, nothing else."
          },
          { role: "user", content: text }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translation = provider === "ollama-cloud" 
      ? data.choices?.[0]?.message?.content 
      : data.choices?.[0]?.message?.content;
      
    return NextResponse.json({ translation: translation || text });
  } catch (error) {
    return NextResponse.json(
      { error: "Translation failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
