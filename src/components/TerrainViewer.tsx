import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { DoubleSide, Vector3 } from "three";
import {
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minus,
  Mountain,
  Plus,
  RotateCcw,
  Sprout,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Layer } from "../lib/api/types";
import {
  buildBoundaryFill,
  buildTerrainGeometry,
  drapeBoundary,
  worldPoint,
} from "../lib/terrain";
import { supportsWebGL } from "../lib/webgl";
import { ResolutionBadge } from "./ResolutionBadge";

type ViewAction = "zoomIn" | "zoomOut" | "left" | "right" | "reset";
interface Command {
  action: ViewAction;
  id: number;
}
class TerrainBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function TerrainFallback() {
  const { t } = useTranslation();
  return (
    <div className="terrain-fallback">
      <Mountain size={48} strokeWidth={1.15} />
      <h2>{t("explore.unavailableTitle")}</h2>
      <p>{t("explore.unavailableBody")}</p>
      <Link to="/farm/analysis" className="button button-secondary">
        {t("explore.fallback")}
        <ArrowRight size={18} className="directional" />
      </Link>
    </div>
  );
}
function Surface({
  terrain,
  overlay,
  exaggeration,
  comparison,
}: {
  terrain: Layer;
  overlay: Layer;
  exaggeration: number;
  comparison: number;
}) {
  const geometry = useMemo(
    () => buildTerrainGeometry(terrain, overlay, exaggeration, comparison),
    [terrain, overlay, exaggeration, comparison],
  );
  const fill = useMemo(
    () => buildBoundaryFill(terrain, exaggeration),
    [terrain, exaggeration],
  );
  const boundary = useMemo(
    () => drapeBoundary(terrain, exaggeration),
    [terrain, exaggeration],
  );
  const split = useMemo(
    () =>
      Array.from({ length: 45 }, (_, index) =>
        worldPoint(terrain, comparison / 100, index / 44, exaggeration, 0.03),
      ),
    [terrain, comparison, exaggeration],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => fill?.dispose(), [fill]);
  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={1}
          metalness={0}
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#fbf9e6"
          wireframe
          transparent
          opacity={0.09}
          depthWrite={false}
        />
      </mesh>
      {fill && (
        <mesh geometry={fill}>
          <meshBasicMaterial
            color="#e2f0ad"
            transparent
            opacity={0.22}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {boundary.length > 1 && (
        <Line points={boundary} color="#f3f2cf" lineWidth={2.8} />
      )}
      <Line
        points={split}
        color="#fff9dd"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />
    </group>
  );
}
function ViewControls({ command }: { command: Command | null }) {
  const control = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate } = useThree();
  useEffect(() => {
    if (!command || !control.current) return;
    const target = control.current.target;
    if (command.action === "reset") {
      camera.position.set(13, 12, 16);
      target.set(0, 0.7, 0);
    } else {
      const offset = camera.position.clone().sub(target);
      if (command.action === "zoomIn" || command.action === "zoomOut")
        offset.multiplyScalar(command.action === "zoomIn" ? 0.86 : 1.16);
      else
        offset.applyAxisAngle(
          new Vector3(0, 1, 0),
          command.action === "left" ? 0.28 : -0.28,
        );
      camera.position.copy(target).add(offset);
    }
    control.current.update();
    invalidate();
  }, [command, camera, invalidate]);
  return (
    <OrbitControls
      ref={control}
      makeDefault
      target={[0, 0.7, 0]}
      enableDamping
      minDistance={8}
      maxDistance={37}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2.1}
      enablePan={false}
    />
  );
}
export function TerrainViewer({
  terrain,
  overlay,
  exaggeration,
  comparison,
}: {
  terrain: Layer;
  overlay: Layer;
  exaggeration: number;
  comparison: number;
}) {
  const { t } = useTranslation();
  const [supported] = useState(supportsWebGL);
  const [command, setCommand] = useState<Command | null>(null);
  const act = (action: ViewAction) =>
    setCommand((previous) => ({ action, id: (previous?.id ?? 0) + 1 }));
  if (!supported) return <TerrainFallback />;
  return (
    <TerrainBoundary fallback={<TerrainFallback />}>
      <div className="terrain-canvas-wrap">
        <div className="terrain-top-badges">
          <ResolutionBadge
            meters={overlay.nativeResolutionM}
            illustrative={overlay.illustrative}
          />
          <span className="terrain-active-layer">
            {t(overlay.label, { defaultValue: overlay.label })}
          </span>
        </div>
        <Canvas
          className="terrain-canvas"
          aria-label={t("explore.mapLabel")}
          camera={{ position: [13, 12, 16], fov: 37 }}
          dpr={[1, 1.5]}
          frameloop="demand"
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={["#eaf0e2"]} />
          <ambientLight intensity={0.85} />
          <directionalLight position={[-7, 15, 8]} intensity={1.6} />
          <directionalLight position={[8, 5, -5]} intensity={0.35} />
          <Surface
            terrain={terrain}
            overlay={overlay}
            exaggeration={exaggeration}
            comparison={comparison}
          />
          <ViewControls command={command} />
        </Canvas>
        <div className="terrain-field-label absolute top-15 start-4 pointer-events-none">
          <Sprout size={16} />
          {t("explore.boundary")}
        </div>
        <div className="terrain-view-controls">
          <button
            className="icon-button"
            onClick={() => act("left")}
            aria-label={t("explore.orbitLeft")}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => act("right")}
            aria-label={t("explore.orbitRight")}
          >
            <ArrowRight size={19} />
          </button>
          <span />
          <button
            className="icon-button"
            onClick={() => act("zoomIn")}
            aria-label={t("explore.zoomIn")}
          >
            <Plus size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => act("zoomOut")}
            aria-label={t("explore.zoomOut")}
          >
            <Minus size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => act("reset")}
            aria-label={t("explore.reset")}
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <p className="terrain-interaction-hint">
          <Maximize size={13} />
          {t("explore.controls")}
        </p>
      </div>
    </TerrainBoundary>
  );
}
