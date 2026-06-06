import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "الإدارة" }] }),
  component: AdminPage,
});

function AdminPage() {
  const nav = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return nav({ to: "/auth" });
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) {
        toast.error("غير مصرح");
        nav({ to: "/app" });
      } else setAuthorized(true);
    })();
  }, [nav]);

  if (!authorized) return null;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-xl">لوحة الإدارة</h1>
          <Button asChild variant="outline" size="sm">
            <Link to="/app"><ArrowRight className="h-4 w-4 ml-1" /> رجوع</Link>
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="passwords">باسوردات التبويبات</TabsTrigger>
            <TabsTrigger value="tariff">التعريفات</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4"><UsersPanel /></TabsContent>
          <TabsContent value="passwords" className="mt-4"><PasswordsPanel /></TabsContent>
          <TabsContent value="tariff" className="mt-4"><TariffPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("id, username, created_at");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [admin, setAdmin] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = `${u.trim().toLowerCase()}@app.local`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: p,
      options: { data: { username: u.trim() } },
    });
    if (error) return toast.error(error.message);
    if (data.user) {
      if (admin) await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
      else await supabase.from("user_roles").insert({ user_id: data.user.id, role: "user" });
      toast.success("تم إنشاء المستخدم");
      setU(""); setP(""); setAdmin(false);
      qc.invalidateQueries({ queryKey: ["admin_profiles"] });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">إنشاء مستخدم</h3>
        <form onSubmit={create} className="space-y-3">
          <div><Label>اسم المستخدم</Label><Input value={u} onChange={(e) => setU(e.target.value)} required /></div>
          <div><Label>كلمة المرور</Label><Input type="password" value={p} onChange={(e) => setP(e.target.value)} required minLength={6} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} /> صلاحية أدمن</label>
          <Button type="submit">إنشاء</Button>
        </form>
      </Card>
      <Card className="p-4 space-y-2">
        <h3 className="font-semibold">المستخدمون الحاليون</h3>
        <div className="space-y-1">
          {users?.map((x) => (
            <div key={x.id} className="flex justify-between text-sm p-2 bg-muted rounded">
              <span>{x.username}</span>
              <span className="text-xs text-muted-foreground">{x.roles.join(", ") || "user"}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PasswordsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["tab_passwords"],
    queryFn: async () => {
      const { data } = await supabase.from("tab_passwords").select("*");
      return data ?? [];
    },
  });

  const save = async (tab: string, pw: string) => {
    const { error } = await supabase.from("tab_passwords").update({ password: pw }).eq("tab_key", tab);
    if (error) toast.error(error.message);
    else { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["tab_passwords"] }); }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold">كلمات مرور التبويبات</h3>
      {data?.map((row) => (
        <PwRow key={row.tab_key} tabKey={row.tab_key} current={row.password} onSave={save} />
      ))}
    </Card>
  );
}

function PwRow({ tabKey, current, onSave }: { tabKey: string; current: string; onSave: (t: string, v: string) => void }) {
  const [v, setV] = useState(current);
  const name = tabKey === "installation" ? "تركيب العداد" : "المخالفة";
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1"><Label>{name}</Label><Input value={v} onChange={(e) => setV(e.target.value)} /></div>
      <Button onClick={() => onSave(tabKey, v)}>حفظ</Button>
    </div>
  );
}

function TariffPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_tariff"],
    queryFn: async () => {
      const { data } = await supabase.from("tariff_items").select("*").order("category").order("sort_order");
      return data ?? [];
    },
  });

  const groups: Record<string, typeof data> = {};
  (data ?? []).forEach((i) => { (groups[i.category] ||= []).push(i); });

  const update = async (id: string, value: number) => {
    const { error } = await supabase.from("tariff_items").update({ value }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم"); qc.invalidateQueries({ queryKey: ["admin_tariff"] }); qc.invalidateQueries({ queryKey: ["tariff_items"] }); }
  };

  const labels: Record<string, string> = {
    meter_price: "أسعار العدادات", valve: "المحابس", pipe: "المواسير", slope: "المسلوبات",
    install_meter: "تركيب العداد", install_valve: "تركيب المحبس", install_pipe: "تركيب المواسير", install_slope: "تركيب المسلوبة",
    insurance: "تأمين العداد", encroachment_water: "تعدي المياه", encroachment_sewage: "تعدي الصرف",
    settings: "ثوابت (إشراف/شهداء)",
  };

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([cat, items]) => (
        <Card key={cat} className="p-4 space-y-2">
          <h3 className="font-semibold">{labels[cat] ?? cat}</h3>
          <div className="grid md:grid-cols-3 gap-2">
            {items?.map((it) => (
              <TariffRow key={it.id} item={it} onSave={(v) => update(it.id, v)} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function TariffRow({ item, onSave }: { item: { label: string; value: number }; onSave: (v: number) => void }) {
  const [v, setV] = useState(item.value);
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1"><Label className="text-xs">{item.label}</Label><Input type="number" value={v} onChange={(e) => setV(+e.target.value)} /></div>
      <Button size="sm" onClick={() => onSave(v)}>حفظ</Button>
    </div>
  );
}