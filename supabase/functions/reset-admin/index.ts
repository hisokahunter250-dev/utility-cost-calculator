import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: list } = await supabase.auth.admin.listUsers();
  for (const u of list?.users ?? []) {
    await supabase.auth.admin.deleteUser(u.id);
  }
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: "admin@app.local",
    password: "admin123",
    email_confirm: true,
    user_metadata: { username: "admin" },
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (created.user) {
    await supabase.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
  }
  return new Response(JSON.stringify({ ok: true, username: "admin", password: "admin123" }), {
    headers: { "content-type": "application/json" },
  });
});
