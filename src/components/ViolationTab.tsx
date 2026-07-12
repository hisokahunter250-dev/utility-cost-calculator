import { useFormStore } from "@/lib/store";
import { useTariff, useConsumptionTariff, groupByCategory } from "@/lib/tariff";
import { calcViolation } from "@/lib/calc";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("ar-EG", { maximumFractionDigits: 2 });

const CATEGORIES = [
  { value: "منزلي", density: "", diameters: ["منزلي"] },
  {
    value: "غير منزلي",
    densities: ["كثيف", "قليل"],
    diameters: ["نص بوصة", "تلات تربع", "بوصة", "بوصة وربع", "بوصة ونص", "2 بوصة"],
  },
  {
    value: "خدمي وحكومي",
    density: "",
    diameters: ["نص بوصة", "تلات تربع", "بوصة", "بوصة وربع", "بوصة ونص", "2 بوصة"],
  },
  {
    value: "اخري",
    densities: ["كثيف"],
    diameters: ["نص بوصة", "تلات تربع", "بوصة", "بوصة وربع", "بوصة ونص", "2 بوصة"],
  },
];

export function ViolationTab() {
  const v = useFormStore((x) => x.violation);
  const set = useFormStore((x) => x.setViolation);
  const { data: items } = useTariff();
  const { data: cons } = useConsumptionTariff();
  const g = groupByCategory(items);

  const r = calcViolation(v, items, cons as any);

  const cat = CATEGORIES.find((c) => c.value === v.category) ?? CATEGORIES[0];

  const updateB = (i: number, p: Partial<typeof v.buildings[0]>) =>
    set({ buildings: v.buildings.map((b, idx) => (idx === i ? { ...b, ...p } : b)) });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4 shadow-sm border-border/60">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="font-semibold text-lg">المدخلات</h3>
          <span className="text-xs text-muted-foreground">حساب المخالفة</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>المباني</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                set({ buildings: [...v.buildings, { area: 0, basement: 0, ground: 1, repeated: 0 }] })
              }
            >
              <Plus className="h-4 w-4 ml-1" /> إضافة
            </Button>
          </div>
          {v.buildings.map((b, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-end">
              <NumField label={`مساحة م${i + 1}`} value={b.area} onChange={(x) => updateB(i, { area: x })} />
              <NumField label="بدروم" value={b.basement} onChange={(x) => updateB(i, { basement: x })} />
              <NumField label="أرضي" value={b.ground} onChange={(x) => updateB(i, { ground: x })} />
              <NumField label="متكرر" value={b.repeated} onChange={(x) => updateB(i, { repeated: x })} />
              {v.buildings.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => set({ buildings: v.buildings.filter((_, idx) => idx !== i) })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="fence" checked={v.hasFence} onCheckedChange={(c) => set({ hasFence: !!c })} />
          <Label htmlFor="fence">يوجد سور</Label>
        </div>
        {v.hasFence && (
          <div className="grid grid-cols-4 gap-2">
            <NumField label="الطول" value={v.fenceLength} onChange={(x) => set({ fenceLength: x })} />
            <NumField label="العرض" value={v.fenceWidth} onChange={(x) => set({ fenceWidth: x })} />
            <NumField label="السمك" value={v.fenceThickness} onChange={(x) => set({ fenceThickness: x })} />
            <NumField label="الارتفاع" value={v.fenceHeight} onChange={(x) => set({ fenceHeight: x })} />
          </div>
        )}

        <SelectField
          label="قطر العداد (مياه)"
          options={g["encroachment_water"]}
          value={v.diameter}
          onChange={(x) => set({ diameter: x })}
        />
        <NumField label="التلفيات (ج.م)" value={v.damages} onChange={(x) => set({ damages: x })} />
        <NumField label="الاهدار (م³)" value={v.waste} onChange={(x) => set({ waste: x })} />

        <div className="space-y-2">
          <Label>نوع النشاط</Label>
          <Select
            value={v.category}
            onValueChange={(val) => {
              const c = CATEGORIES.find((c) => c.value === val)!;
              set({
                category: val,
                density: c.densities?.[0] ?? "",
                consumptionDiameter: c.diameters[0],
              });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {cat.densities && (
          <div className="space-y-2">
            <Label>الكثافة</Label>
            <Select value={v.density} onValueChange={(x) => set({ density: x })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {cat.densities.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>قطر العداد للاستهلاك</Label>
          <Select value={v.consumptionDiameter} onValueChange={(x) => set({ consumptionDiameter: x })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cat.diameters.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 pt-2 border-t">
          <Label>طريقة احتساب أشهر الاستهلاك</Label>
          <RadioGroup
            value={v.consumptionMode}
            onValueChange={(val: "auto" | "manual") => set({ consumptionMode: val })}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2">
              <RadioGroupItem value="auto" id="cm-auto" /> تلقائي
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="manual" id="cm-manual" /> من تاريخ - إلى تاريخ
            </label>
          </RadioGroup>
        </div>
        {v.consumptionMode === "auto" ? (
          <NumField label="عدد أشهر الاستهلاك" value={v.consumptionMonths} onChange={(x) => set({ consumptionMonths: x })} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">من</Label>
              <Input type="month" value={v.consumptionFrom} onChange={(e) => set({ consumptionFrom: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">إلى</Label>
              <Input type="month" value={v.consumptionTo} onChange={(e) => set({ consumptionTo: e.target.value })} />
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">عدد الشهور المحسوبة: {r.months} (شامل الشهر الأخير)</p>
          </div>
        )}

        <div className="space-y-2 pt-3 border-t">
          <Label>حالة الصرف</Label>
          <RadioGroup
            value={v.sewageStatus}
            onValueChange={(val: "served" | "not_served") => set({ sewageStatus: val })}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2">
              <RadioGroupItem value="not_served" id="vns" /> غير مخدوم
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="served" id="vs" /> مخدوم بالصرف
            </label>
          </RadioGroup>
        </div>
        {v.sewageStatus === "served" && (
          <>
            <SelectField
              label="قطر الصرف"
              options={g["encroachment_sewage"]}
              value={v.sewageDiameterKey}
              onChange={(x) => set({ sewageDiameterKey: x })}
            />
            <NumField label="تلفيات الصرف" value={v.sewageDamages} onChange={(x) => set({ sewageDamages: x })} />
            <NumField label="استهلاك الصرف (شهور)" value={v.sewageConsumption} onChange={(x) => set({ sewageConsumption: x })} />
          </>
        )}
      </Card>

      <Card className="p-6 space-y-3 shadow-sm border-border/60 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="font-semibold text-lg">نتائج المخالفة</h3>
          <span className="text-xs text-muted-foreground">التفاصيل</span>
        </div>
        <ResultRow label="التعدي" value={r.encroachment} />
        <ResultRow label="التلفيات" value={r.damages} />
        <ResultRow label="الاهدار" value={r.wasteCost} />
        <ResultRow label="مياه المباني" value={r.buildingsWater} />
        <ResultRow label="الاستهلاك" value={r.consumptionCost} />
        <ResultRow label="التصالح (10% من التعدي)" value={r.settlement} />
        {v.sewageStatus === "served" && (
          <>
            <div className="pt-2 border-t text-xs text-muted-foreground">بنود الصرف</div>
            <ResultRow label="تعدي الصرف" value={r.sewageEncroachment} />
            <ResultRow label="تلفيات الصرف" value={r.sewageDamages} />
            <ResultRow label="استهلاك الصرف" value={r.sewageConsumptionCost} />
            <ResultRow label="تصالح الصرف" value={r.sewageSettlement} />
          </>
        )}
        <div className="flex justify-between pt-3 border-t font-bold text-lg">
          <span>إجمالي المخالفة</span>
          <span className="text-primary">{fmt(r.total)} ج.م</span>
        </div>
      </Card>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={value || ""} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options?: { key: string; label: string; value: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options?.map((o) => (
            <SelectItem key={o.key} value={o.key}>
              {o.label} — {o.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{fmt(value)}</span>
    </div>
  );
}

function EditableRow({
  label,
  value,
  defaultValue,
  isOverridden,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  defaultValue: number;
  isOverridden: boolean;
  onChange: (v: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground flex-1">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-28 h-8"
      />
      {isOverridden && (
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onReset}>
          ↺ {defaultValue.toLocaleString("ar-EG")}
        </Button>
      )}
    </div>
  );
}