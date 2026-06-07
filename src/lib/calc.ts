import type { InstallationState, ViolationState } from "./store";
import type { TariffItem } from "./tariff";
import { findItem } from "./tariff";

/** Round to nearest 0.5 */
export const roundHalf = (n: number) => Math.round(n * 2) / 2;

export function calcInstallation(s: InstallationState, items: TariffItem[] | undefined) {
  const get = (cat: string, key: string) => findItem(items, cat, key)?.value ?? 0;

  const meterDiameter = s.meterKey.replace(/_(card|mech)$/, "");
  const isCard = /_card$/.test(s.meterKey);
  const valveCount = Math.max(1, s.valveCount || 1);
  const pipeCount = Math.max(1, s.pipeCount || 1);

  const meter = get("meter_price", s.meterKey);
  const valve = get("valve", s.valveKey) * valveCount;
  const pipe = get("pipe", s.pipeKey) * pipeCount;
  const slope = get("slope", s.slopeKey);
  const itemsTotal = meter + valve + pipe + slope;

  const instMeter = get("install_meter", meterDiameter);
  const instValve = get("install_valve", s.valveKey) * valveCount;
  const instPipe = get("install_pipe", s.pipeKey) * pipeCount;
  const instSlope = get("install_slope", s.slopeKey);
  const installations = instMeter + instValve + instPipe + instSlope;

  const adminFees = roundHalf((itemsTotal + installations) * 0.2);

  // Connection (ربط)
  const totalBuildingArea = s.buildings.reduce((a, b) => a + b.area, 0);
  let connection = 0;
  if (s.sewageStatus === "served") {
    connection = s.buildings.reduce((sum, b) => sum + b.area * b.floors * 35, 0);
  } else {
    const rate =
      totalBuildingArea < 1000 ? 20 : totalBuildingArea <= 3000 ? 25 : 30;
    const buildingsConn = s.buildings.reduce(
      (sum, b) => sum + b.area * b.floors * rate,
      0,
    );
    const emptyArea = Math.max(0, s.totalArea - totalBuildingArea);
    connection = buildingsConn + emptyArea * 5;
  }

  const vat = roundHalf((installations + adminFees + connection) * 0.14);

  // Card meters → no insurance. Otherwise use insurance matching meter diameter.
  const insurance = s.isPrepaid || isCard
    ? 0
    : get("insurance", meterDiameter) || get("insurance", s.insuranceKey);

  const supervision = get("settings", "supervision");
  const supervisionTax = roundHalf(supervision * 0.14);
  const martyrs = get("settings", "martyrs_fund");

  const total =
    meter +
    valve +
    pipe +
    slope +
    installations +
    adminFees +
    connection +
    vat +
    insurance +
    supervision +
    supervisionTax +
    martyrs;

  return {
    meter,
    valve,
    pipe,
    slope,
    itemsTotal,
    installations,
    adminFees,
    connection,
    vat,
    insurance,
    supervision,
    supervisionTax,
    martyrs,
    total,
  };
}

export const PRICE_PER_M3 = 12.01;

const RATIOS = {
  foundation: 0.408,
  basement: 0.263,
  ground: 0.238,
  repeated: 0.238,
};

export function calcViolation(
  v: ViolationState,
  items: TariffItem[] | undefined,
  cons: Array<{
    category: string;
    density: string | null;
    diameter: string;
    month: string;
    water: number;
    sewage: number;
    water_plus_sewage: number;
    sewage_pump: number;
  }> | undefined,
) {
  const get = (cat: string, key: string) => findItem(items, cat, key)?.value ?? 0;

  const encroachment = get("encroachment_water", v.diameter);
  const damages = v.damages;
  const wasteCost = v.waste * PRICE_PER_M3;
  const consumptionCost = computeConsumption(
    cons,
    v.category,
    v.density,
    v.consumptionDiameter,
    v.consumptionMonths,
    "water",
  );

  // Buildings water
  const buildingWaterRaw = v.buildings.reduce((sum, b) => {
    const foundation = b.area * RATIOS.foundation;
    const basement = b.area * b.basement * RATIOS.basement;
    const ground = b.area * b.ground * RATIOS.ground;
    const repeated = b.area * b.repeated * RATIOS.repeated;
    return sum + foundation + basement + ground + repeated;
  }, 0);
  const fenceVol = v.hasFence
    ? (v.fenceLength + v.fenceWidth) * 2 * v.fenceThickness * v.fenceHeight * 0.7
    : 0;
  const buildingsWater = (buildingWaterRaw + fenceVol) * PRICE_PER_M3;

  const settlement = encroachment * 0.1;

  // sewage block
  let sewageEncroachment = 0,
    sewageDamages = 0,
    sewageConsumptionCost = 0,
    sewageSettlement = 0;
  if (v.sewageStatus === "served") {
    sewageEncroachment = get("encroachment_sewage", v.sewageDiameterKey);
    sewageDamages = v.sewageDamages;
    sewageConsumptionCost = computeConsumption(
      cons,
      v.category,
      v.density,
      v.consumptionDiameter,
      v.consumptionMonths,
      "sewage",
    );
    sewageSettlement = sewageEncroachment * 0.1;
  }

  const total =
    encroachment +
    damages +
    wasteCost +
    consumptionCost +
    buildingsWater +
    settlement +
    sewageEncroachment +
    sewageDamages +
    sewageConsumptionCost +
    sewageSettlement;

  return {
    encroachment,
    damages,
    wasteCost,
    consumptionCost,
    buildingsWater,
    settlement,
    sewageEncroachment,
    sewageDamages,
    sewageConsumptionCost,
    sewageSettlement,
    total,
  };
}

function computeConsumption(
  cons:
    | Array<{
        category: string;
        density: string | null;
        diameter: string;
        month: string;
        water: number;
        sewage: number;
      }>
    | undefined,
  category: string,
  density: string,
  diameter: string,
  months: number,
  field: "water" | "sewage",
) {
  if (!cons || months <= 0) return 0;
  const rows = cons
    .filter(
      (r) =>
        r.category === category &&
        (density ? r.density === density : r.density === null) &&
        r.diameter === diameter,
    )
    .sort((a, b) => b.month.localeCompare(a.month));
  if (rows.length === 0) return 0;
  // current month is the most recent row available; older months go further back.
  // If months > rows.length: pad with the oldest available row's value (which represents 2-2023 and earlier per spec).
  let sum = 0;
  for (let i = 0; i < months; i++) {
    const row = rows[Math.min(i, rows.length - 1)];
    sum += Number(row[field]) || 0;
  }
  return sum;
}