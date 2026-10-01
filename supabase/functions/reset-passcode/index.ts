// Edge Function: reset-passcode
//
// A child's whole login is their name plus a passcode. There is no email on a
// student account, so the reset-link path every adult gets is not open to
// them: a child who forgets their passcode is simply locked out, with no
// button anywhere that could let them back in. This is that button, and it
// lives with the teacher, which is where a child in this ministry would
// actually go for help.
//
// The new passcode is generated here, server side, in the same shape signup
// uses (first name + "mfm" + three digits) so it is still something a child
// can hold in their head. It is returned once, to the teacher who asked for
// it, to read out or write down.
//
// verify_jwt stays ON (deploy with verify_jwt: true). The caller's identity
// comes from the forwarded Authorization header and is checked against
// profiles.role - an admin may reset anyone, a teacher only a child in one of
// their own classes. Nothing about who is asking is taken from the body.
//
// Deploy: supabase functions deploy reset-passcode --project-ref zdgbatkxjxiecqshnmwh
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

/** Same shape the signup screen builds, so a reset passcode is no harder to
 * remember than the original: first name, "mfm", three random digits. */
function buildPasscode(fullName: string): string {
  const first = (fullName.trim().split(/\s+/)[0] ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "kid";
  const digits = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${first}mfm${digits}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { student_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const studentId = (body.student_id ?? "").trim();
  if (!studentId) return json({ error: "Missing student." }, 400);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Not signed in." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: authData, error: authError } = await caller.auth.getUser();
  if (authError || !authData.user) return json({ error: "Not signed in." }, 401);
  const callerId = authData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", callerId)
    .maybeSingle();

  if (callerError) return json({ error: callerError.message }, 500);
  const role = callerProfile?.role;
  if (role !== "admin" && role !== "teacher") {
    return json({ error: "Only a teacher or an admin can reset a passcode." }, 403);
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, class_id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) return json({ error: studentError.message }, 500);
  if (!student) return json({ error: "That child was not found." }, 404);

  // A teacher's reach stops at their own classes. A child with no class yet
  // is an admin's to help, not any teacher who happens to know the id.
  if (role === "teacher") {
    if (!student.class_id) {
      return json({ error: "That child is not in one of your classes yet. Ask an admin." }, 403);
    }
    const { data: klass, error: classError } = await admin
      .from("classes")
      .select("id")
      .eq("id", student.class_id)
      .eq("teacher_id", callerId)
      .maybeSingle();
    if (classError) return json({ error: classError.message }, 500);
    if (!klass) return json({ error: "That child is not in one of your classes." }, 403);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();

  if (profileError) return json({ error: profileError.message }, 500);

  const fullName = profile?.full_name ?? "";

  // login_key is unique across every student, so a freshly rolled passcode can
  // collide with somebody else's. Re-roll rather than fail - eight tries over
  // a thousand digit combinations per first name is plenty.
  for (let attempt = 0; attempt < 8; attempt++) {
    const passcode = buildPasscode(fullName);
    const { error: keyError } = await admin
      .from("students")
      .update({
        login_key: passcode.toLowerCase(),
        passcode_reset_at: new Date().toISOString(),
        passcode_reset_by: callerId,
      })
      .eq("id", studentId);

    if (keyError) {
      if (keyError.code === "23505") continue;
      return json({ error: keyError.message }, 500);
    }

    const { error: passwordError } = await admin.auth.admin.updateUserById(studentId, { password: passcode });
    if (passwordError) return json({ error: passwordError.message }, 500);

    return json({ passcode, full_name: fullName });
  }

  return json({ error: "Could not set a new passcode. Please try again." }, 500);
});
