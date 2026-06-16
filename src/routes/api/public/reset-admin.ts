import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/reset-admin")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        for (const u of list?.users ?? []) {
          await supabaseAdmin.auth.admin.deleteUser(u.id);
        }
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: "admin@app.local",
          password: "admin123",
          email_confirm: true,
          user_metadata: { username: "admin" },
        });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        if (created.user) {
          await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
        }
        return new Response(JSON.stringify({ ok: true, username: "admin", password: "admin123" }));
      },
    },
  },
});