// Edge Function: join-class
//
// Lets a kid claim their name on a class roster and set a login PIN, without
// ever needing an email address. This is the ONLY place a student account is
// created, and it has to run with the service role key (never exposed to the
// browser) because creating a Supabase Auth user is an admin-only operation.
//
// Deploy: supabase functions deploy join-class --project-ref zdgbatkxjxiecqshnmwh
// (or via the Supabase dashboard / MCP deploy_edge_function tool). verify_jwt
// must stay OFF since a not-yet-authenticated kid is the one calling this.
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

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24) || "kid"
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { join_code?: string; roster_id?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const joinCode = (body.join_code ?? "").trim().toUpperCase();
  const rosterId = (body.roster_id ?? "").trim();
  const pin = (body.pin ?? "").trim();

  if (!joinCode || !rosterId) return json({ error: "Missing class code or roster entry." }, 400);
  if (!/^[0-9]{4,6}$/.test(pin)) return json({ error: "PIN must be 4 to 6 digits." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: klass, error: classError } = await admin
    .from("classes")
    .select("id, name, archived")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (classError) return json({ error: classError.message }, 500);
  if (!klass || klass.archived) return json({ error: "That class code was not found." }, 404);

  const { data: roster, error: rosterError } = await admin
    .from("class_roster")
    .select("id, full_name, claimed, class_id")
    .eq("id", rosterId)
    .eq("class_id", klass.id)
    .maybeSingle();

  if (rosterError) return json({ error: rosterError.message }, 500);
  if (!roster) return json({ error: "That name was not found in this class." }, 404);
  if (roster.claimed) {
    return json({ error: "That name has already been claimed. Ask your teacher for help if this wasn't you." }, 409);
  }

  const email = `stu-${crypto.randomUUID()}@kids.mfmchildren.app`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { full_name: roster.full_name },
  });

  if (createError || !created?.user) {
    return json({ error: createError?.message ?? "Could not create the account." }, 500);
  }

  const studentId = created.user.id;
  const username = `${slugify(roster.full_name)}-${studentId.slice(0, 4)}`;

  // handle_new_auth_user already inserted a bare profiles row; fill it in.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: studentId, role: "student", full_name: roster.full_name }, { onConflict: "id" });

  if (profileError) {
    await admin.auth.admin.deleteUser(studentId);
    return json({ error: profileError.message }, 500);
  }

  const { error: studentError } = await admin.from("students").insert({ id: studentId, class_id: klass.id, username });

  if (studentError) {
    await admin.auth.admin.deleteUser(studentId);
    return json({ error: studentError.message }, 500);
  }

  const { error: claimError } = await admin
    .from("class_roster")
    .update({ claimed: true, student_id: studentId })
    .eq("id", roster.id);

  if (claimError) return json({ error: claimError.message }, 500);

  await admin.from("class_history").insert({
    student_id: studentId,
    class_id: klass.id,
    class_name: klass.name,
    changed_by: studentId,
  });

  return json({ email, student_id: studentId, class_name: klass.name });
});
