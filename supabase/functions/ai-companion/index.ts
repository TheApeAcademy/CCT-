// Edge Function: ai-companion
//
// "Bible Buddy" - a tightly-scoped kid-facing AI that answers simple Bible
// questions and defers anything sensitive to a trusted adult instead of
// trying to handle it. The Anthropic API key never reaches the browser -
// this function is the only thing that ever calls it, same shape as
// ApeAcademy's generate-and-deliver function.
//
// verify_jwt stays ON (deploy with verify_jwt: true) - only an already
// signed-in student may call this. The caller's identity comes from the
// forwarded Authorization header, not from anything the client claims in
// the body, so a student can't log a question under a different student_id.
//
// Requires the ANTHROPIC_API_KEY secret to be set on this project:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref zdgbatkxjxiecqshnmwh
//
// Deploy: supabase functions deploy ai-companion --project-ref zdgbatkxjxiecqshnmwh
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You are Bible Buddy, a friendly AI companion for children in a church's Sunday School app.

Rules you must always follow:
- Only answer questions about the Bible, Bible characters, Bible stories, prayer, or basic Christian faith, in a way a child aged 6-14 can understand.
- Keep answers short: 2-4 short sentences, warm and encouraging tone.
- When relevant, mention a Bible reference (e.g. "John 3:16") so a teacher could look it up.
- If the question is NOT about the Bible or faith (homework, personal advice, anything unrelated), gently say that's not something you know about and suggest asking a teacher or parent instead.
- If the question touches anything sensitive or concerning - safety, self-harm, abuse, family problems, being bullied, feeling scared or unsafe, or anything an AI should not try to handle alone - do NOT attempt to answer or counsel. Respond with kindness, briefly acknowledge their feelings, and clearly say this is something they should talk to their teacher or a trusted adult about right away, since that matters more than anything Bible Buddy could say.
- Never ask the child for personal information (address, phone, photos, passwords, school name).`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { question?: string; is_anonymous?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const question = (body.question ?? "").trim();
  const isAnonymous = body.is_anonymous === true;

  if (question.length < 2 || question.length > 500) {
    return json({ error: "Please ask a question between 2 and 500 characters." }, 400);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Not signed in." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: authData, error: authError } = await caller.auth.getUser();
  if (authError || !authData.user) return json({ error: "Not signed in." }, 401);
  const studentId = authData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: student, error: studentError } = await admin.from("students").select("id, class_id").eq("id", studentId).maybeSingle();
  if (studentError) return json({ error: studentError.message }, 500);
  if (!student) return json({ error: "Only students can ask Bible Buddy." }, 403);

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) return json({ error: "Bible Buddy isn't set up yet - ask an admin to add the API key." }, 503);

  const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!aiResponse.ok) {
    const detail = await aiResponse.text();
    return json({ error: `Bible Buddy is having trouble right now (${aiResponse.status}). ${detail.slice(0, 200)}` }, 502);
  }

  const aiData = await aiResponse.json();
  const answer: string = aiData?.content?.[0]?.text?.trim() ?? "Sorry, I couldn't think of an answer - ask your teacher instead!";

  const { error: insertError } = await admin.from("ai_companion_messages").insert({
    student_id: studentId,
    class_id: student.class_id,
    question,
    answer,
    is_anonymous: isAnonymous,
  });
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ answer });
});
