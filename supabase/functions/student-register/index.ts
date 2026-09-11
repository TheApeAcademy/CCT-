// Edge Function: student-register
//
// Creates a student's account from just a name + passcode (guardian phone
// optional). The passcode is generated client-side from the kid's own name
// (firstname + "mfm" + a random digit, e.g. "joshmfm7") so it's easy for a
// child to remember — this function just validates the shape it can take,
// it doesn't regenerate it. No class code needed anymore — class enrollment
// happens separately, after signup, when a teacher looks the student up by
// their Student Code. Runs with the service role key server-side only;
// never exposed to the browser. verify_jwt stays OFF since a
// not-yet-authenticated kid is the one calling this.
//
// Deploy: supabase functions deploy student-register --project-ref zdgbatkxjxiecqshnmwh
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

function randomStudentCode(): string {
  return "MFM" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { full_name?: string; guardian_phone?: string; passcode?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const fullName = (body.full_name ?? "").trim().replace(/\s+/g, " ");
  const guardianPhone = (body.guardian_phone ?? "").trim() || null;
  const passcode = (body.passcode ?? "").trim();

  if (fullName.length < 2 || fullName.length > 80) {
    return json({ error: "Please enter your full name." }, 400);
  }
  if (!/^[a-z0-9]{4,40}$/.test(passcode)) {
    return json({ error: "That passcode doesn't look right. Please try again." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const email = `stu-${crypto.randomUUID()}@kids.mfmchildren.app`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: passcode,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created?.user) {
    return json({ error: createError?.message ?? "Could not create the account." }, 500);
  }

  const studentId = created.user.id;

  // handle_new_auth_user already inserted a bare profiles row; fill it in.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: studentId, role: "student", full_name: fullName, phone: guardianPhone }, { onConflict: "id" });

  if (profileError) {
    await admin.auth.admin.deleteUser(studentId);
    return json({ error: profileError.message }, 500);
  }

  let studentCode: string | null = null;
  for (let attempt = 0; attempt < 8 && !studentCode; attempt++) {
    const candidate = randomStudentCode();
    const { error: insertError } = await admin.from("students").insert({
      id: studentId,
      class_id: null,
      username: candidate,
      student_code: candidate,
      guardian_phone: guardianPhone,
    });
    if (!insertError) {
      studentCode = candidate;
    } else if (insertError.code !== "23505") {
      await admin.auth.admin.deleteUser(studentId);
      return json({ error: insertError.message }, 500);
    }
  }

  if (!studentCode) {
    await admin.auth.admin.deleteUser(studentId);
    return json({ error: "Could not generate a Student Code. Please try again." }, 500);
  }

  return json({ email, student_id: studentId, student_code: studentCode });
});
