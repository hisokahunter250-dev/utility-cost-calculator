import { useMemo, useState } from "react";
import { useConsumptionTariff, consumptionKey } from "@/lib/tariff";
import { useFormStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

export function TariffTab() {
  const { data } = useConsumptionTariff();
  const overrides = useFormStore((s) => s.consumptionOverrides);
  const setOverride = useFormStore((s) => s.setConsumptionOverride);
  const clearOverride = useFormStore((s) => s.clearConsumptionOverride);

  const categories = useMemo(
    () => Array.from(new Set(data.map((r) => r.category))),
    [data],
  );
  const [category, setCategory] = useState(categories[0] ?? "");

  const densities = useMemo(
    () =>
      Array.from(
        new Set(
          data.filter((r) => r.category === category).map((r) => r.density ?? ""),
        ),
      ),
    [data, category],
  );
  const [density, setDensity] = useState(densities[0] ?? "");

  const diameters = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .filter(
              (r) => r.category === category && (r.density ?? "") === density,
            )
            .map((r) => r.diameter),
        ),
      ),
    [data, category, density],
  );
  const [diameter, setDiameter] = useState(diameters[0] ?? "");

  // Reset dependents when parent changes
  if (!densities.includes(density) && densities[0] !== undefined) {
    setDensity(densities[0]);
  }
  if (!diameters.includes(diameter) && diameters[0] !== undefined) {
    setDiameter(diameters[0]);
  }

  const rows = useMemo(
    () =>
      data
        .filter(
          (r) =>
            r.category === category &&
            (r.density ?? "") === density &&
            r.diameter === diameter,
        )
        .sort((a, b) => b.month.localeCompare(a.month)),
    [data, category, density, diameter],
  );

  return (
    <Card className="p-6 space-y-4 shadow-sm border-border/60">
      <div className="flex items-center justify-between pb-3 border-b">
        <h3 className="font-semibold text-lg">تعريفة الاستهلاك</h3>
        <span className="text-xs text-muted-foreground">
          تعديل قيم الشهور المستخدمة في حساب الاستهلاك
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>النشاط</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {densities.some((d) => d !== "") && (
          <div className="space-y-2">
            <Label>الكثافة</Label>
            <Select value={density} onValueChange={setDensity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {densities.map((d) => (
                  <SelectItem key={d || "_"} value={d}>{d || "—"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>القطر</Label>
          <Select value={diameter} onValueChange={setDiameter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {diameters.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-right font-medium">الشهر</th>
              <th className="p-2 text-right font-medium">مياه</th>
              <th className="p-2 text-right font-medium">صرف</th>
              <th className="p-2 text-right font-medium">الإجمالي (مياه + صرف)</th>
              <th className="p-2 text-right font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const k = consumptionKey(r.category, r.density, r.diameter, r.month);
              const ov = overrides[k];
              const isOv = !!ov;
              const total = (Number(r.water) || 0) + (Number(r.sewage) || 0);
              return (
                <tr key={r.month} className="border-t">
                  <td className="p-2 font-mono">{r.month}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={r.water}
                      onChange={(e) =>
                        setOverride(k, { water: +e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={r.sewage}
                      onChange={(e) =>
                        setOverride(k, { sewage: +e.target.value })
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="p-2 font-mono text-right">{total.toLocaleString()}</td>
                  <td className="p-2 text-center">
                    {isOv && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="إرجاع للقيمة الأصلية"
                        onClick={() => clearOverride(k)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  لا توجد بيانات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}