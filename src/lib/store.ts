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
  installMeterKey: string;
  installValveKey: string;
  installPipeKey: string;
  installSlopeKey: string;
  insuranceKey: string;
  isPrepaid: boolean;
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
};

const defaultInstallation: InstallationState = {
  totalArea: 0,
  buildings: [{ area: 0, floors: 1 }],
  sewageStatus: "not_served",
  meterKey: "3/4_card",
  valveKey: "3/4",
  pipeKey: "3/4",
  slopeKey: "1/4",
  installMeterKey: "3/4",
  installValveKey: "3/4",
  installPipeKey: "3/4",
  installSlopeKey: "1/4",
  insuranceKey: "3/4_home",
  isPrepaid: false,
};

const defaultViolation: ViolationState = {
  buildings: [{ area: 0, basement: 0, ground: 1, repeated: 0 }],
  hasFence: false,
  fenceLength: 0,
  fenceWidth: 0,
  fenceThickness: 0,
  fenceHeight: 0,
  damages: 0,
  waste: 0,
  consumption: 0,
  diameter: "3/4",
  sewageStatus: "not_served",
  sewageDiameterKey: "9",
  sewageDamages: 0,
  sewageConsumption: 0,
  category: "منزلي",
  density: "",
  consumptionDiameter: "منزلي",
  consumptionMonths: 0,
};

type Store = {
  installation: InstallationState;
  violation: ViolationState;
  setInstallation: (p: Partial<InstallationState>) => void;
  setViolation: (p: Partial<ViolationState>) => void;
  resetInstallation: () => void;
  resetViolation: () => void;
};

export const useFormStore = create<Store>()(
  persist(
    (set) => ({
      installation: defaultInstallation,
      violation: defaultViolation,
      setInstallation: (p) => set((s) => ({ installation: { ...s.installation, ...p } })),
      setViolation: (p) => set((s) => ({ violation: { ...s.violation, ...p } })),
      resetInstallation: () => set({ installation: defaultInstallation }),
      resetViolation: () => set({ violation: defaultViolation }),
    }),
    { name: "water-calc-forms" },
  ),
);