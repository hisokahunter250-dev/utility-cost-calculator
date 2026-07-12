import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallationTab } from "@/components/InstallationTab";
import { ViolationTab } from "@/components/ViolationTab";
import { Droplets } from "lucide-react";

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
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40">
      <header className="border-b bg-card/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-md">
            <Droplets className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-xl leading-tight">حاسبة المياه</h1>
            <p className="text-xs text-muted-foreground">تركيب العدادات وحساب المخالفات</p>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="installation">
          <TabsList className="grid grid-cols-2 w-full max-w-md h-11 p-1 bg-muted/60">
            <TabsTrigger value="installation" className="h-9 data-[state=active]:shadow-sm">تركيب العداد</TabsTrigger>
            <TabsTrigger value="violation" className="h-9 data-[state=active]:shadow-sm">المخالفة</TabsTrigger>
          </TabsList>
          <TabsContent value="installation" className="mt-6">
            <InstallationTab />
          </TabsContent>
          <TabsContent value="violation" className="mt-6">
            <ViolationTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
