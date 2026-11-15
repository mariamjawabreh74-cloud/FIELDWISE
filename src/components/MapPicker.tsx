import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as LibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Coordinates } from "../lib/api/types";
import { supportsWebGL } from "../lib/webgl";

interface MapPickerProps {
  center?: Coordinates | null;
  selected?: Coordinates | null;
  onPick?: (point: Coordinates) => void;
  onReady?: (map: LibreMap) => (() => void) | void;
  label?: string;
  zoom?: number;
}
export function MapPicker({
  center,
  selected,
  onPick,
  onReady,
  label,
  zoom = 14,
}: MapPickerProps) {
  const { t, i18n } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const callbacks = useRef({ onPick, onReady });
  const initial = useRef({ center, zoom });
  callbacks.current = { onPick, onReady };
  const [unavailable, setUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    if (!supportsWebGL()) {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    setReady(false);
    let cleanup: (() => void) | void;
    let map: LibreMap;
    try {
      const point = initial.current.center;
      map = new maplibregl.Map({
        container: container.current,
        center: point ? [point.longitude, point.latitude] : [0, 20],
        zoom: point ? initial.current.zoom : 2,
        attributionControl: false,
        style: {
          version: 8,
          sources: {
            basemap: {
              type: "raster",
              tiles: [
                "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "basemap",
              type: "raster",
              source: "basemap",
              paint: { "raster-saturation": -0.4, "raster-opacity": 0.92 },
            },
          ],
        },
        locale: {
          "NavigationControl.ZoomIn": t("explore.zoomIn"),
          "NavigationControl.ZoomOut": t("explore.zoomOut"),
          "NavigationControl.ResetBearing": t("explore.reset"),
          "Map.Title": label ?? t("location.mapLabel"),
        },
      });
      mapRef.current = map;
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true }),
        "top-right",
      );
      map.on("load", () => {
        setReady(true);
        cleanup = callbacks.current.onReady?.(map);
      });
      map.on("click", (event) =>
        callbacks.current.onPick?.({
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
        }),
      );
      map
        .getCanvas()
        .setAttribute("aria-label", label ?? t("location.mapLabel"));
      map.on("error", (event) => {
        if (/webgl|context lost/i.test(event.error.message))
          setUnavailable(true);
      });
    } catch {
      setUnavailable(true);
      return;
    }
    return () => {
      cleanup?.();
      marker.current?.remove();
      marker.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [attempt, i18n.language, label, t]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (
      !selected ||
      !Number.isFinite(selected.latitude) ||
      !Number.isFinite(selected.longitude)
    ) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    if (!marker.current) {
      marker.current = new maplibregl.Marker({
        color: "#2f5d3a",
        draggable: !!onPick,
      })
        .setLngLat([selected.longitude, selected.latitude])
        .addTo(map);
      marker.current.on("dragend", () => {
        const p = marker.current!.getLngLat();
        callbacks.current.onPick?.({ longitude: p.lng, latitude: p.lat });
      });
    } else marker.current.setLngLat([selected.longitude, selected.latitude]);
    if (
      map.getZoom() < 10 ||
      !map.getBounds().contains([selected.longitude, selected.latitude])
    )
      map.easeTo({
        center: [selected.longitude, selected.latitude],
        zoom: 14,
        duration: 600,
      });
  }, [selected, ready, onPick]);
  return (
    <div className="map-wrap" dir="ltr">
      <div
        ref={container}
        className="map-canvas"
        aria-label={label ?? t("location.mapLabel")}
      />
      {unavailable && (
        <div className="map-fallback" dir={i18n.dir()}>
          <MapPin size={35} />
          <p>{t("location.mapUnavailable")}</p>
          <button
            className="button button-secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            <RefreshCw size={17} />
            {t("common.retry")}
          </button>
        </div>
      )}
      <div className="map-attribution">{t("location.basemap")}</div>
    </div>
  );
}
