import { useCallback, useEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import type { Polygon } from "geojson";
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { CheckCircle2, Edit3, Pentagon, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MapPicker } from "./MapPicker";
import type { Coordinates } from "../lib/api/types";
import {
  formatBoundaryCoordinates,
  parseBoundaryCoordinates,
  validateBoundary,
} from "../lib/geometry";

export function PolygonEditor({
  value,
  onChange,
  center,
}: {
  value: Polygon | null;
  onChange: (value: Polygon | null) => void;
  center?: Coordinates | null;
}) {
  const { t, i18n } = useTranslation();
  const draw = useRef<TerraDraw | null>(null);
  const mapRef = useRef<Map | null>(null);
  const valueRef = useRef(value);
  const changeRef = useRef(onChange);
  const syncing = useRef(false);
  valueRef.current = value;
  changeRef.current = onChange;
  const [mode, setMode] = useState("select");
  const [ready, setReady] = useState(false);
  const [coordinates, setCoordinates] = useState(
    formatBoundaryCoordinates(value),
  );
  const validation = validateBoundary(value);
  const format = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 2,
  });
  const fit = (map: Map, shape: Polygon) => {
    const ring = shape.coordinates[0];
    const lngs = ring.map((p) => p[0]),
      lats = ring.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 85, maxZoom: 17, duration: 600 },
    );
  };
  const initialize = useCallback((map: Map) => {
    mapRef.current = map;
    const instance = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map, coordinatePrecision: 7 }),
      modes: [
        new TerraDrawPolygonMode({
          styles: {
            fillColor: "#2f5d3a",
            fillOpacity: 0.2,
            outlineColor: "#2f5d3a",
            outlineWidth: 3,
            closingPointColor: "#2f5d3a",
            closingPointWidth: 7,
          },
        }),
        new TerraDrawSelectMode({
          flags: {
            polygon: {
              feature: {
                draggable: true,
                coordinates: {
                  draggable: true,
                  deletable: true,
                  midpoints: true,
                },
              },
            },
          },
          styles: {
            selectedPolygonColor: "#93ad71",
            selectedPolygonFillOpacity: 0.28,
            selectedPolygonOutlineColor: "#2f5d3a",
            selectedPolygonOutlineWidth: 3,
            selectionPointColor: "#2f5d3a",
            selectionPointWidth: 7,
            midPointColor: "#8aa16d",
          },
        }),
      ],
    });
    instance.start();
    draw.current = instance;
    if (valueRef.current && validateBoundary(valueRef.current).valid) {
      instance.addFeatures([
        {
          id: "farm-boundary",
          type: "Feature",
          properties: { mode: "polygon" },
          geometry: valueRef.current,
        },
      ]);
      fit(map, valueRef.current);
    }
    instance.setMode("select");
    setReady(true);
    instance.on("change", () => {
      if (syncing.current) return;
      const feature = instance
        .getSnapshot()
        .find(
          (feature) =>
            feature.geometry.type === "Polygon" &&
            feature.properties.mode === "polygon",
        );
      const next =
        feature?.geometry.type === "Polygon" ? feature.geometry : null;
      if (JSON.stringify(next) !== JSON.stringify(valueRef.current))
        changeRef.current(next);
    });
    instance.on("finish", (id) => {
      instance.setMode("select");
      instance.selectFeature(id);
      setMode("select");
    });
    return () => {
      instance.stop();
      draw.current = null;
      mapRef.current = null;
      setReady(false);
    };
  }, []);
  useEffect(() => {
    setCoordinates(formatBoundaryCoordinates(value));
    const instance = draw.current;
    if (!instance) return;
    const current = instance
      .getSnapshot()
      .find(
        (feature) =>
          feature.geometry.type === "Polygon" &&
          feature.properties.mode === "polygon",
      );
    if (JSON.stringify(current?.geometry ?? null) === JSON.stringify(value))
      return;
    syncing.current = true;
    instance.clear();
    if (value && validateBoundary(value).valid) {
      instance.addFeatures([
        {
          id: "farm-boundary",
          type: "Feature",
          properties: { mode: "polygon" },
          geometry: value,
        },
      ]);
      if (mapRef.current) fit(mapRef.current, value);
    }
    syncing.current = false;
  }, [value]);
  function startDrawing() {
    if (!draw.current) return;
    draw.current.clear();
    onChange(null);
    draw.current.setMode("polygon");
    setMode("polygon");
  }
  function edit() {
    draw.current?.setMode("select");
    const feature = draw.current
      ?.getSnapshot()
      .find((item) => item.geometry.type === "Polygon");
    if (feature?.id !== undefined) draw.current?.selectFeature(feature.id);
    setMode("select");
  }
  function clear() {
    draw.current?.clear();
    onChange(null);
    setCoordinates("");
    setMode("select");
  }
  return (
    <div className="polygon-editor">
      <div className="map-toolbar">
        <button
          type="button"
          className={`button ${mode === "polygon" ? "button-primary" : "button-secondary"}`}
          onClick={startDrawing}
          disabled={!ready}
        >
          <Pentagon size={18} />
          {t("boundary.draw")}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={!value || !ready}
          onClick={edit}
        >
          <Edit3 size={17} />
          {t("boundary.edit")}
        </button>
        <button
          type="button"
          className="button button-ghost"
          disabled={!value}
          onClick={clear}
        >
          <Trash2 size={17} />
          {t("boundary.delete")}
        </button>
      </div>
      <MapPicker
        center={center}
        onReady={initialize}
        label={t("boundary.mapLabel")}
        zoom={16}
      />
      <p className="field-hint map-instruction">
        {mode === "polygon"
          ? t("boundary.drawing")
          : t("boundary.keyboardHint")}
      </p>
      <div className="area-summary">
        <div>
          <span>{t("boundary.area")}</span>
          <strong>
            {format.format(validation.dunam)} <small>{t("common.dunam")}</small>
          </strong>
        </div>
        <div className="area-secondary">
          <strong>{format.format(validation.hectares)}</strong>
          <span>{t("common.hectares")}</span>
        </div>
        {validation.valid && (
          <span className="boundary-valid">
            <CheckCircle2 size={18} />
            {t("boundary.valid")}
          </span>
        )}
      </div>
      <p className="field-hint">{t("boundary.areaHint")}</p>
      <details className="coordinate-details">
        <summary>{t("boundary.coordinateEditor")}</summary>
        <div className="stack">
          <p className="field-hint">{t("boundary.coordinateHelp")}</p>
          <textarea
            className="textarea coordinate-textarea"
            dir="ltr"
            rows={5}
            value={coordinates}
            onChange={(event) => setCoordinates(event.target.value)}
            aria-label={t("boundary.coordinateEditor")}
          />
          <button
            type="button"
            className="button button-secondary self-start"
            onClick={() => onChange(parseBoundaryCoordinates(coordinates))}
          >
            <CheckCircle2 size={18} />
            {t("boundary.applyCoordinates")}
          </button>
        </div>
      </details>
    </div>
  );
}
