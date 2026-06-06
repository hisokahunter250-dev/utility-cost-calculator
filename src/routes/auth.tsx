import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowSignup, setAllowSignup] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        nav({ to: "/app", replace: true });
        return;
      }
      // Check if any user_roles exist; if none, allow first admin signup
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true });
      setAllowSignup((count ?? 0) === 0);
      if ((count ?? 0) === 0) setMode("signup");
    })();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = `${username.trim().toLowerCase()}@app.local`;
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim() }, emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // First user becomes admin
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
        toast.success("تم إنشاء حساب الأدمن");
        nav({ to: "/app", replace: true });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("بيانات الدخول غير صحيحة");
      else nav({ to: "/app", replace: true });
    }
    setLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">حاسبة المياه</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "إنشاء حساب الأدمن الأول" : "تسجيل الدخول"}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم المستخدم</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : mode === "signup" ? "إنشاء" : "دخول"}
          </Button>
          {allowSignup && (
            <p className="text-xs text-center text-muted-foreground">
              لا يوجد أدمن — أنشئ أول حساب
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}