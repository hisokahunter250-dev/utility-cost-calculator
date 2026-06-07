import { useFormStore } from "@/lib/store";
import { useTariff, groupByCategory, findItem } from "@/lib/tariff";
import { calcInstallation } from "@/lib/calc";
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("ar-EG", { maximumFractionDigits: 2 });

export function InstallationTab() {
  const s = useFormStore((x) => x.installation);
  const set = useFormStore((x) => x.setInstallation);
  const { data: items } = useTariff();
  const g = groupByCategory(items);

  const result = calcInstallation(s, items);

  const updateBuilding = (i: number, p: Partial<{ area: number; floors: number }>) =>
    set({
      buildings: s.buildings.map((b, idx) => (idx === i ? { ...b, ...p } : b)),
    });

  const addBuilding = () => set({ buildings: [...s.buildings, { area: 0, floors: 1 }] });
  const removeBuilding = (i: number) =>
    set({ buildings: s.buildings.filter((_, idx) => idx !== i) });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">المدخلات</h3>
        <div className="space-y-2">
          <Label>المساحة الكلية (م²)</Label>
          <Input
            type="number"
            value={s.totalArea || ""}
            onChange={(e) => set({ totalArea: +e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>حالة الصرف</Label>
          <RadioGroup
            value={s.sewageStatus}
            onValueChange={(v: "served" | "not_served") => set({ sewageStatus: v })}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2">
              <RadioGroupItem value="not_served" id="ns" /> غير مخدوم بالصرف
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="served" id="s" /> مخدوم بالصرف
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>المباني</Label>
            <Button type="button" variant="outline" size="sm" onClick={addBuilding}>
              <Plus className="h-4 w-4 ml-1" /> إضافة
            </Button>
          </div>
          {s.buildings.map((b, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">مساحة م{i + 1} (م²)</Label>
                <Input
                  type="number"
                  value={b.area || ""}
                  onChange={(e) => updateBuilding(i, { area: +e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">عدد الأدوار</Label>
                <Input
                  type="number"
                  value={b.floors || ""}
                  onChange={(e) => updateBuilding(i, { floors: +e.target.value })}
                />
              </div>
              {s.buildings.length > 1 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeBuilding(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <SelectField label="ثمن العداد" options={g["meter_price"]} value={s.meterKey} onChange={(v) => set({ meterKey: v })} />
        <div className="grid grid-cols-[1fr_90px] gap-2 items-end">
          <SelectField label="محبس بلية" options={g["valve"]} value={s.valveKey} onChange={(v) => set({ valveKey: v })} />
          <div className="space-y-2">
            <Label className="text-xs">العدد</Label>
            <Input type="number" min={1} value={s.valveCount || ""} onChange={(e) => set({ valveCount: +e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_90px] gap-2 items-end">
          <SelectField label="مواسير" options={g["pipe"]} value={s.pipeKey} onChange={(v) => set({ pipeKey: v })} />
          <div className="space-y-2">
            <Label className="text-xs">العدد</Label>
            <Input type="number" min={1} value={s.pipeCount || ""} onChange={(e) => set({ pipeCount: +e.target.value })} />
          </div>
        </div>
        <SelectField label="مسلوبة" options={g["slope"]} value={s.slopeKey} onChange={(v) => set({ slopeKey: v })} />
        <p className="text-xs text-muted-foreground">التركيبات تتبع تلقائيًا نفس القطر والعدد للأصناف.</p>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="prepaid"
            checked={s.isPrepaid}
            onCheckedChange={(c) => set({ isPrepaid: !!c })}
          />
          <Label htmlFor="prepaid">عداد مسبوق الدفع (بدون تأمين)</Label>
        </div>
        {!s.isPrepaid && !/_card$/.test(s.meterKey) && (
          <SelectField label="تأمين العداد" options={g["insurance"]} value={s.insuranceKey} onChange={(v) => set({ insuranceKey: v })} />
        )}
        {!s.isPrepaid && /_card$/.test(s.meterKey) && (
          <p className="text-xs text-muted-foreground">العداد كارت — التأمين = 0</p>
        )}
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">النتائج</h3>
        <ResultRow label="ثمن العداد" value={result.meter} />
        <ResultRow label="محبس" value={result.valve} />
        <ResultRow label="مواسير" value={result.pipe} />
        <ResultRow label="مسلوبة" value={result.slope} />
        <div className="pt-2 border-t space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">تركيبات (قابلة للتعديل)</p>
          <EditableRow
            label="تركيب العداد"
            value={result.instMeter}
            defaultValue={result.defInstMeter}
            isOverridden={s.overrideInstallMeter !== undefined}
            onChange={(v) => set({ overrideInstallMeter: v })}
            onReset={() => set({ overrideInstallMeter: undefined })}
          />
          <EditableRow
            label="تركيب المحبس"
            value={result.instValve}
            defaultValue={result.defInstValve}
            isOverridden={s.overrideInstallValve !== undefined}
            onChange={(v) => set({ overrideInstallValve: v })}
            onReset={() => set({ overrideInstallValve: undefined })}
          />
          <EditableRow
            label="تركيب المواسير"
            value={result.instPipe}
            defaultValue={result.defInstPipe}
            isOverridden={s.overrideInstallPipe !== undefined}
            onChange={(v) => set({ overrideInstallPipe: v })}
            onReset={() => set({ overrideInstallPipe: undefined })}
          />
          <EditableRow
            label="تركيب المسلوبة"
            value={result.instSlope}
            defaultValue={result.defInstSlope}
            isOverridden={s.overrideInstallSlope !== undefined}
            onChange={(v) => set({ overrideInstallSlope: v })}
            onReset={() => set({ overrideInstallSlope: undefined })}
          />
        </div>
        <ResultRow label="إجمالي التركيبات" value={result.installations} />
        <ResultRow label="المصاريف الإدارية (20%)" value={result.adminFees} />
        <ResultRow label="الربط على الشبكات" value={result.connection} />
        <ResultRow label="ضريبة القيمة المضافة (14%)" value={result.vat} />
        <ResultRow label="تأمين العداد" value={result.insurance} />
        <EditableRow
          label="مصاريف الإشراف"
          value={result.supervision}
          defaultValue={findItem(items, "settings", "supervision")?.value ?? 0}
          isOverridden={s.overrideSupervision !== undefined}
          onChange={(v) => set({ overrideSupervision: v })}
          onReset={() => set({ overrideSupervision: undefined })}
        />
        <ResultRow label="ضريبة الإشراف (14%)" value={result.supervisionTax} />
        <ResultRow label="صندوق ضحايا الشهداء" value={result.martyrs} />
        <div className="flex justify-between pt-3 border-t font-bold text-lg">
          <span>الإجمالي</span>
          <span className="text-primary">{fmt(result.total)} ج.م</span>
        </div>
      </Card>
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
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
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
          ↺ {fmt(defaultValue)}
        </Button>
      )}
    </div>
  );
}