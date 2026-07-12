import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BuildingInput = { area: number; floors: number };

export type InstallationState = {
  totalArea: number;
  buildings: BuildingInput[];
  sewageStatus: "served" | "not_served";
  meterKey: string;
  valveKey: string;
  pipeKey: string;
  slopeKey: string;
  valveCount: number;
  pipeCount: number;
  slopeCount: number;
  insuranceKey: string;
  isPrepaid: boolean;
  // Optional overrides for displayed/editable values (undefined = use default from tariff)
  overrideInstallMeter?: number;
  overrideInstallValve?: number;
  overrideInstallPipe?: number;
  overrideInstallSlope?: number;
  overrideSupervision?: number;
};

export type ViolationBuilding = {
  area: number;
  basement: number;
  ground: number;
  repeated: number;
};

export type ViolationState = {
  buildings: ViolationBuilding[];
  hasFence: boolean;
  fenceLength: number;
  fenceWidth: number;
  fenceThickness: number;
  fenceHeight: number;
  damages: number;
  waste: number;
  consumption: number;
  diameter: string; // water encroachment key
  sewageStatus: "served" | "not_served";
  sewageDiameterKey: string; // for sewage encroachment
  sewageDamages: number;
  sewageConsumption: number;
  category: string;
  density: string;
  consumptionDiameter: string;
  consumptionMonths: number;
  consumptionMode: "auto" | "manual";
  consumptionFrom: string; // YYYY-MM
  consumptionTo: string; // YYYY-MM
  // Optional overrides for tariff-derived values
  overrideEncroachment?: number;
  overrideSewageEncroachment?: number;
  overrideConsumption?: number;
  overrideSewageConsumption?: number;
};

export type ConsumptionOverride = Partial<{
  water: number;
  sewage: number;
  sewage_pump: number;
  water_plus_sewage: number;
}>;

const defaultInstallation: InstallationState = {
  totalArea: 0,
  buildings: [{ area: 0, floors: 1 }],
  sewageStatus: "not_served",
  meterKey: "3/4_card",
  valveKey: "3/4",
  pipeKey: "3/4",
  slopeKey: "1/4",
  valveCount: 0,
  pipeCount: 0,
  slopeCount: 0,
  insuranceKey: "3/4_home",
  isPrepaid: false,
};

const defaultViolation: ViolationState = {
  buildings: [{ area: 0, basement: 0, ground: 1, repeated: 0 }],
  hasFence: true,
  fenceLength: 14.4,
  fenceWidth: 10,
  fenceThickness: 0.25,
  fenceHeight: 3,
  damages: 500,
  waste: 5,
  consumption: 0,
  diameter: "1.5",
  sewageStatus: "not_served",
  sewageDiameterKey: "9",
  sewageDamages: 0,
  sewageConsumption: 0,
  category: "غير منزلي",
  density: "قليل",
  consumptionDiameter: "تلات تربع",
  consumptionMonths: 36,
  consumptionMode: "auto",
  consumptionFrom: "",
  consumptionTo: "",
};

type Store = {
  installation: InstallationState;
  violation: ViolationState;
  consumptionOverrides: Record<string, ConsumptionOverride>;
  setInstallation: (p: Partial<InstallationState>) => void;
  setViolation: (p: Partial<ViolationState>) => void;
  resetInstallation: () => void;
  resetViolation: () => void;
  setConsumptionOverride: (key: string, patch: ConsumptionOverride) => void;
  clearConsumptionOverride: (key: string) => void;
};

export const useFormStore = create<Store>()(
  persist(
    (set) => ({
      installation: defaultInstallation,
      violation: defaultViolation,
      consumptionOverrides: {},
      setInstallation: (p) => set((s) => ({ installation: { ...s.installation, ...p } })),
      setViolation: (p) => set((s) => ({ violation: { ...s.violation, ...p } })),
      resetInstallation: () => set({ installation: defaultInstallation }),
      resetViolation: () => set({ violation: defaultViolation }),
      setConsumptionOverride: (key, patch) =>
        set((s) => ({
          consumptionOverrides: {
            ...s.consumptionOverrides,
            [key]: { ...(s.consumptionOverrides[key] ?? {}), ...patch },
          },
        })),
      clearConsumptionOverride: (key) =>
        set((s) => {
          const next = { ...s.consumptionOverrides };
          delete next[key];
          return { consumptionOverrides: next };
        }),
    }),
    { name: "water-calc-forms", version: 4 },
  ),
);