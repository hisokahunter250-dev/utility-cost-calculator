import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CreateInput = { username: string; password: string; isAdmin?: boolean };
type PwInput = { userId: string; password: string };
type DelInput = { userId: string };
type BootstrapInput = { username: string; password: string };

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("غير مصرح");
}

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CreateInput) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const email = `${data.username.trim().toLowerCase()}@app.local`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username.trim() },
    });
    if (error) throw new Error(error.message);
    if (created.user) {
      await admin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: data.isAdmin ? "admin" : "user" });
    }
    return { ok: true };
  });

export const adminUpdatePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: PwInput) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const { error } = await admin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: DelInput) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك حذف نفسك");
    const admin = await getAdmin();
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Bootstrap first admin — only works when zero users exist. No auth required.
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: BootstrapInput) => d)
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { count } = await admin
      .from("user_roles")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) throw new Error("يوجد مستخدمون بالفعل");
    const email = `${data.username.trim().toLowerCase()}@app.local`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username.trim() },
    });
    if (error) throw new Error(error.message);
    if (created.user) {
      await admin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    }
    return { ok: true };
  });