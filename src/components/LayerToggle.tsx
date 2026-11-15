import {
  Check,
  CloudRain,
  Droplets,
  Layers3,
  Leaf,
  Mountain,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LayerKey } from "../lib/api/types";
import { ResolutionBadge } from "./ResolutionBadge";

const icons = {
  terrain: Mountain,
  ndvi: Leaf,
  rainfall: CloudRain,
  soil_moisture: Droplets,
  slope: Layers3,
};
export function LayerToggle({
  layerKey,
  active,
  onToggle,
  resolution,
  illustrative,
}: {
  layerKey: LayerKey;
  active: boolean;
  onToggle: () => void;
  resolution?: number;
  illustrative?: boolean;
}) {
  const { t } = useTranslation();
  const Icon = icons[layerKey];
  return (
    <button
      className={`layer-toggle ${active ? "active" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span className="layer-icon">
        <Icon size={21} strokeWidth={1.4} />
      </span>
      <span className="layer-toggle-copy">
        <strong>{t(`explore.${layerKey}`)}</strong>
        <ResolutionBadge meters={resolution} illustrative={illustrative} />
      </span>
      <span className="layer-check">{active && <Check size={13} />}</span>
    </button>
  );
}
