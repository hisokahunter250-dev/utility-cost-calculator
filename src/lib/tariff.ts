import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TariffItem = {
  id: string;
  category: string;
  key: string;
  label: string;
  value: number;
  sort_order: number;
};

export function useTariff() {
  return useQuery({
    queryKey: ["tariff_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tariff_items")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as TariffItem[];
    },
  });
}

export function groupByCategory(items: TariffItem[] | undefined) {
  const g: Record<string, TariffItem[]> = {};
  if (!items) return g;
  for (const it of items) {
    (g[it.category] ||= []).push(it);
  }
  return g;
}

export function findItem(items: TariffItem[] | undefined, category: string, key: string) {
  return items?.find((i) => i.category === category && i.key === key);
}

export function useConsumptionTariff() {
  return useQuery({
    queryKey: ["consumption_tariff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumption_tariff")
        .select("*")
        .order("month");
      if (error) throw error;
      return data;
    },
  });
}