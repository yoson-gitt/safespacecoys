// Supabase Edge Function: validate_mood
// Validates incoming mood entry payloads.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const ALLOWED_EMOTIONS = new Set([
  "frustrated",
  "anxious",
  "sad",
  "numb",
  "hopeful",
  "content"
]);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const emotion = (body.emotion || "").toString();
    const intensity = Number(body.intensity);

    if (!ALLOWED_EMOTIONS.has(emotion)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid emotion" }), { status: 400 });
    }

    if (!Number.isFinite(intensity) || intensity < 1 || intensity > 10) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid intensity" }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (_e) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
  }
});
