import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallationTab } from "@/components/InstallationTab";
import { ViolationTab } from "@/components/ViolationTab";

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
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="font-bold text-xl">حاسبة المياه</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="installation">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="installation">تركيب العداد</TabsTrigger>
            <TabsTrigger value="violation">المخالفة</TabsTrigger>
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
