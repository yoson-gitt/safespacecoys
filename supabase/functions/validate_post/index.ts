// Supabase Edge Function: validate_post
// Validates incoming post content and type.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const MAX_LEN = 500;
const ALLOWED_TYPES = new Set(["vent", "support"]);
const BANNED = [
  "self-harm",
  "suicide",
  "kill myself"
];

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const content = (body.content || "").toString().trim();
    const postType = (body.post_type || "").toString();

    if (!content) {
      return new Response(JSON.stringify({ ok: false, error: "Content required" }), { status: 400 });
    }

    if (content.length > MAX_LEN) {
      return new Response(JSON.stringify({ ok: false, error: "Content too long" }), { status: 400 });
    }

    if (!ALLOWED_TYPES.has(postType)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid post_type" }), { status: 400 });
    }

    const lower = content.toLowerCase();
    for (const term of BANNED) {
      if (lower.includes(term)) {
        return new Response(JSON.stringify({ ok: false, error: "Content violates safety policy" }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (_e) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
  }
});
