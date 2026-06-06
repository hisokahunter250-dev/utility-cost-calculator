import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TabPasswordGate } from "@/components/TabPasswordGate";
import { InstallationTab } from "@/components/InstallationTab";
import { ViolationTab } from "@/components/ViolationTab";
import { LogOut, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "حاسبة المياه" }] }),
  component: AppPage,
});

function AppPage() {
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, []);

  const signOut = async () => {
    sessionStorage.removeItem("tab_unlocks");
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-xl">حاسبة المياه</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to="/admin"><Settings className="h-4 w-4 ml-1" /> الإدارة</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 ml-1" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="installation">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="installation">تركيب العداد</TabsTrigger>
            <TabsTrigger value="violation">المخالفة</TabsTrigger>
          </TabsList>
          <TabsContent value="installation" className="mt-6">
            <TabPasswordGate tabKey="installation">
              <InstallationTab />
            </TabPasswordGate>
          </TabsContent>
          <TabsContent value="violation" className="mt-6">
            <TabPasswordGate tabKey="violation">
              <ViolationTab />
            </TabPasswordGate>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}