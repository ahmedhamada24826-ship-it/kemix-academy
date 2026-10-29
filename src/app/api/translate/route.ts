import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  texts: z.array(z.string().min(1).max(8_000)).min(1).max(24),
  source: z.enum(["ar", "en"]),
  target: z.enum(["ar", "en"]),
}).refine((value) => value.texts.every((text) => text.trim().length > 0), {
  message: "Translation texts cannot be blank.",
}).refine((value) => value.source !== value.target, {
  message: "Source and target languages must be different.",
}).refine((value) => value.texts.reduce((total, text) => total + text.length, 0) <= 48_000, {
  message: "Translation request is too large.",
});

const responseSchema = z.object({
  translations: z.array(z.string().min(1)).min(1).max(24),
}).refine((value) => value.translations.every((text) => text.trim().length > 0), {
  message: "Translation responses cannot be blank.",
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The translation request must contain valid JSON." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The translation request is invalid.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      console.error(`Offline translation service returned HTTP ${response.status}`);
      return NextResponse.json(
        { error: "The local translation service could not translate this page." },
        { status: 502 },
      );
    }

    const result = responseSchema.safeParse(await response.json());
    if (!result.success || result.data.translations.length !== parsed.data.texts.length) {
      console.error("Offline translation service returned an invalid response.");
      return NextResponse.json(
        { error: "The local translation service returned an invalid response." },
        { status: 502 },
      );
    }

    return NextResponse.json(result.data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to reach the local offline translation service.", error);
    return NextResponse.json(
      { error: "Start the local translation service to translate page content." },
      { status: 503 },
    );
  }
}
