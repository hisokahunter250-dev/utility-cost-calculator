import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SESSION_KEY = "tab_unlocks";

function getUnlocked(): Record<string, boolean> {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}
function setUnlocked(tab: string) {
  const u = getUnlocked();
  u[tab] = true;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
}

export function TabPasswordGate({
  tabKey,
  children,
}: {
  tabKey: string;
  children: React.ReactNode;
}) {
  const [unlocked, setU] = useState(false);
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setU(!!getUnlocked()[tabKey]);
  }, [tabKey]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("tab_passwords")
      .select("password")
      .eq("tab_key", tabKey)
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast.error("تعذر التحقق: " + error.message);
      return;
    }
    if (!data) {
      toast.error("لم يتم العثور على كلمة مرور لهذا التبويب");
      return;
    }
    if ((data.password ?? "").trim() === pw.trim()) {
      setUnlocked(tabKey);
      setU(true);
    } else {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-center">هذا التبويب محمي</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            <Label>كلمة مرور التبويب</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            دخول
          </Button>
        </form>
      </Card>
    </div>
  );
}