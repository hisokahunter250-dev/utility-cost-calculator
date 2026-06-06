import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حاسبة المياه" },
      { name: "description", content: "حاسبة تركيب العدادات والمخالفات" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      navigate({ to: data.user ? "/app" : "/auth", replace: true });
    })();
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground" dir="rtl">
      جاري التحويل…
    </div>
  );
}
