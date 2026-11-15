import type { Crop } from "../lib/api/types";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

const cropFamilies: Record<keyof typeof en.crops, string> = {
  olive: "oleaceae",
  wheat: "poaceae",
  barley: "poaceae",
  chickpea: "fabaceae",
  lentil: "fabaceae",
  fava: "fabaceae",
  tomato: "solanaceae",
  cucumber: "cucurbitaceae",
  okra: "malvaceae",
  grape: "vitaceae",
  almond: "rosaceae",
  clover: "fabaceae",
};
const colors = [
  "#92a96b",
  "#c4a86a",
  "#b9a071",
  "#91ac83",
  "#c1a17b",
  "#83a27e",
  "#bd7c65",
  "#6e9b79",
  "#83a76d",
  "#9b8da8",
  "#bda48a",
  "#8fa780",
];
export const crops: Crop[] = (
  Object.keys(en.crops) as (keyof typeof en.crops)[]
).map((id, index) => ({
  id,
  names: { ar: ar.crops[id], en: en.crops[id] },
  label: `crops.${id}`,
  family: cropFamilies[id],
  color: colors[index],
  simulated: true,
}));
