// Fully offline tariff data — no backend, no network calls.
import { CONSUMPTION_TARIFF } from "./data/consumption";

export type TariffItem = {
  id: string;
  category: string;
  key: string;
  label: string;
  value: number;
  sort_order: number;
};

type Raw = [string, string, string, number, number?];
// [category, key, label, value, sort_order]
const RAW: Raw[] = [
  ["encroachment_sewage","9","تعدي صرف 9",2000,1],
  ["encroachment_sewage","9-12","تعدي صرف 9 إلى 12",3000,2],
  ["encroachment_sewage","12-15","تعدي صرف 12 إلى 15",5000,3],
  ["encroachment_sewage","15-18","تعدي صرف 15 إلى 18",15000,4],
  ["encroachment_sewage","18-24","تعدي صرف 18 إلى 24",20000,5],
  ["encroachment_sewage","24+","تعدي صرف أكبر من 24",30000,6],
  ["encroachment_water","1/2","تعدي 1/2",2000,1],
  ["encroachment_water","3/4","تعدي 3/4",3000,2],
  ["encroachment_water","1","تعدي 1",4000,3],
  ["encroachment_water","1.5","تعدي 1.5",5000,4],
  ["encroachment_water","2","تعدي 2",10000,5],
  ["encroachment_water","4","تعدي 4",40000,6],
  ["encroachment_water","6","تعدي 6",50000,7],
  ["encroachment_water","8","تعدي 8",70000,8],
  ["encroachment_water","10","تعدي 10",100000,9],
  ["install_meter","3/4","تركيب عداد 3/4",55,1],
  ["install_meter","1","تركيب عداد 1",75,2],
  ["install_meter","1.5","تركيب عداد 1.5",100,3],
  ["install_meter","2","تركيب عداد 2",250,4],
  ["install_meter","3","تركيب عداد 3",275,5],
  ["install_meter","4","تركيب عداد 4",315,6],
  ["install_meter","6","تركيب عداد 6",400,7],
  ["install_meter","8+","تركيب عداد 8 فأكثر",500,8],
  ["install_pipe","1/2","تركيب مواسير 1/2",15,1],
  ["install_pipe","3/4","تركيب مواسير 3/4",25,2],
  ["install_pipe","1","تركيب مواسير 1",27,3],
  ["install_pipe","1.5","تركيب مواسير 1.5",30,4],
  ["install_pipe","2","تركيب مواسير 2",35,5],
  ["install_pipe","3","تركيب مواسير 3",40,6],
  ["install_pipe","4","تركيب مواسير 4",45,7],
  ["install_pipe","6","تركيب مواسير 6",50,8],
  ["install_pipe","8","تركيب مواسير 8 فأكثر",55,9],
  ["install_slope","1/2","تركيب مسلوبة/بريزة 1/2",110,1],
  ["install_slope","3/4","تركيب مسلوبة/بريزة 3/4",155,2],
  ["install_slope","1","تركيب مسلوبة/بريزة 1",170,3],
  ["install_slope","1.5","تركيب مسلوبة/بريزة 1.5",200,4],
  ["install_slope","2","تركيب مسلوبة/بريزة 2",220,5],
  ["install_slope","3","تركيب مسلوبة/بريزة 3",250,6],
  ["install_slope","4","تركيب مسلوبة/بريزة 4",300,7],
  ["install_slope","6","تركيب مسلوبة/بريزة 6",350,8],
  ["install_slope","8","تركيب مسلوبة/بريزة 8 فأكثر",500,9],
  ["install_valve","3/4","تركيب محبس 3/4",50,1],
  ["install_valve","1","تركيب محبس 1",75,2],
  ["install_valve","1.5","تركيب محبس 1.5",100,3],
  ["install_valve","2","تركيب محبس 2",125,4],
  ["insurance","3/4","تأمين 3/4",3000,1],
  ["insurance","1","تأمين 1",4500,2],
  ["insurance","1.5","تأمين 1.5",6000,3],
  ["insurance","2","تأمين 2",8000,4],
  ["insurance","3","تأمين 3",9000,5],
  ["insurance","4","تأمين 4",13500,6],
  ["insurance","6","تأمين 6",14000,7],
  ["insurance","8","تأمين 8",20000,8],
  ["insurance","12+","تأمين 12 فأكثر",30000,9],
  ["insurance","3/4_home","تأمين 3/4 منزلي",150,10],
  ["meter_price","3/4_card","3/4 كارت",1450,1],
  ["meter_price","1_card","بوصة كارت",1750,2],
  ["meter_price","1_mech","بوصة ميكانيكي",2000,3],
  ["meter_price","1.5_mech","بوصة ونص ميكانيكي",2500,4],
  ["meter_price","1.5_card","بوصة ونص كارت",4400,5],
  ["meter_price","2_mech","اتنين بوصة ميكانيكي",4500,6],
  ["meter_price","3_mech","3 بوصة ميكانيكي",5800,7],
  ["meter_price","4_mech","4 بوصة ميكانيكي",6500,8],
  ["meter_price","6_mech","6 بوصة ميكانيكي",12800,9],
  ["pipe","3/4","مواسير 3/4",44,1],
  ["pipe","1","مواسير بوصة",60,2],
  ["pipe","1.5","مواسير بوصة ونص",90,3],
  ["pipe","2","مواسير 2 بوصة",112,4],
  ["valve","3/4","محبس 3/4",90,1],
  ["valve","1","محبس بوصة",120,2],
  ["valve","1.5","محبس بوصة ونص",230,3],
  ["valve","2","محبس 2 بوصة",375,4],
  ["slope","1/4","مسلوبة 1/4",460,1],
  ["slope","1/6","مسلوبة 1/6",563,2],
  ["slope","2/6","مسلوبة 2/6",720,3],
  ["slope","1/8","مسلوبة 1/8",620,4],
  ["slope","2/8","مسلوبة 2/8",770,5],
  ["slope","1.5/4","مسلوبة 1.5/4",380,6],
  ["slope","1.5/6","مسلوبة 1.5/6",400,7],
  ["settings","supervision","مصاريف الإشراف",250,1],
  ["settings","martyrs_fund","صندوق ضحايا الشهداء",5,2],
];

export const TARIFF_ITEMS: TariffItem[] = RAW.map(([category, key, label, value, sort_order], i) => ({
  id: `${category}_${key}_${i}`,
  category,
  key,
  label,
  value,
  sort_order: sort_order ?? i,
}));

export function useTariff() {
  return { data: TARIFF_ITEMS } as const;
}

export function useConsumptionTariff() {
  return { data: CONSUMPTION_TARIFF } as const;
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