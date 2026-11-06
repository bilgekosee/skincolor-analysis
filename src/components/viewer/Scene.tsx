"use client";

import { OrbitControls, useProgress } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Avatar, type AvatarLook } from "./Avatar";

// Neutral, near-daylight lighting: colour judgement breaks down under tinted light.
function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => env.dispose(), [env]);
  return <primitive object={env} attach="environment" />;
}

function Loader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-white">
      Model yükleniyor… %{Math.round(progress)}
    </div>
  );
}

export type View = "front" | "side" | "close";

export const STAGE_COLOR = "#8a8a8c";

const VIEWS: Record<View, { position: [number, number, number]; target: [number, number, number] }> = {
  front: { position: [0, -0.02, 1.08], target: [0, -0.035, 0] },
  side: { position: [0.78, -0.01, 0.72], target: [0, -0.02, 0] },
  close: { position: [0, 0.02, 0.5], target: [0, 0.01, 0] },
};

type Controls = { target: THREE.Vector3; update: () => void };

function moveCamera(camera: THREE.Camera, controls: Controls | null, view: View) {
  const v = VIEWS[view];
  camera.position.set(...v.position);
  controls?.target.set(...v.target);
  controls?.update();
}

function CameraRig({ view, gender }: { view: View; gender: string }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as Controls | null;
  useEffect(() => moveCamera(camera, controls, view), [camera, controls, view, gender]);
  return null;
}

export default function Scene({ look, view }: { look: AvatarLook; view: View }) {
  return (
    <>
      <Canvas
        shadows
        scene={{ environmentIntensity: 0.55 }}
        dpr={[1, 2]}
        camera={{ fov: 28, position: VIEWS.front.position, near: 0.05, far: 10 }}
        gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1 }}
      >
        <color attach="background" args={[STAGE_COLOR]} />
        <StudioEnvironment />
        <directionalLight
          position={[0.9, 1.2, 1.4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.01}
        />
        <directionalLight position={[-1.2, 0.4, 1]} intensity={0.7} />
        <directionalLight position={[0, 0.8, -1.4]} intensity={1.1} />
        <hemisphereLight args={["#ffffff", "#6b6b6b", 0.4]} />
        <Suspense fallback={null}>
          <Avatar look={look} />
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          enablePan={false}
          minDistance={0.3}
          maxDistance={1.6}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.62}
          minAzimuthAngle={-Math.PI * 0.6}
          maxAzimuthAngle={Math.PI * 0.6}
        />
        <CameraRig view={view} gender={look.gender} />
      </Canvas>
      <Loader />
    </>
  );
}
