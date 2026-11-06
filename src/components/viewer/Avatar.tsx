"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  createEyeMaterial,
  createHairMaterial,
  createMetalMaterial,
  createScalpMaterial,
  createSkinMaterial,
  createTopMaterial,
  remapMaskAttributes,
} from "./materials";

export type Gender = "female" | "male";
export type Neckline = "vneck" | "turtle";

export type Makeup = {
  lip: string;
  lipAmt: number;
  gloss: number;
  blush: string;
  blushAmt: number;
  shadow: string;
  shadowAmt: number;
  liner: string;
  linerAmt: number;
  brow: string;
  browAmt: number;
  contour: string;
  contourAmt: number;
};

export type AvatarLook = {
  gender: Gender;
  neckline: Neckline;
  skin: string;
  hair: string;
  eyes: string;
  top: string;
  metalHex: string;
  earrings: boolean;
  necklace: boolean;
  makeup: Makeup;
};

const DRACO_PATH = "/draco/";
const MODEL_URL: Record<Gender, string> = {
  female: "/models/female.glb",
  male: "/models/male.glb",
};
const HAIR_TEXTURES: Record<Gender, [string, string]> = {
  female: ["/textures/hair_f_pack.png", "/textures/hair_f_normal.png"],
  male: ["/textures/hair_m_pack.png", "/textures/hair_m_normal.png"],
};

function prepareTexture(texture: THREE.Texture) {
  texture.flipY = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
}

// buildRig mutates the cached glTF scene, so it must run once per scene even
// when React re-invokes memo callbacks (StrictMode).
const rigCache = new WeakMap<THREE.Object3D, ReturnType<typeof createRig>>();

function buildRig(scene: THREE.Object3D, pack: THREE.Texture, normal: THREE.Texture) {
  let rig = rigCache.get(scene);
  if (!rig) {
    rig = createRig(scene, pack, normal);
    rigCache.set(scene, rig);
  }
  return rig;
}

function createRig(scene: THREE.Object3D, pack: THREE.Texture, normal: THREE.Texture) {
  const skin = createSkinMaterial();
  const eye = createEyeMaterial();
  const hair = createHairMaterial(pack, normal);
  const scalp = createScalpMaterial();
  const top = createTopMaterial();
  const metal = createMetalMaterial();
  const tops: Record<Neckline, THREE.Object3D[]> = { vneck: [], turtle: [] };
  const jewelry: THREE.Object3D[] = [];
  const found: { body?: THREE.Mesh } = {};

  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const name = node.name.toUpperCase();
    remapMaskAttributes(node.geometry);
    node.castShadow = true;
    node.receiveShadow = true;
    if (name.startsWith("BODY")) {
      node.material = skin.material;
      found.body = node;
    } else if (name.startsWith("EYE")) node.material = eye.material;
    else if (name.startsWith("HAIRCARD")) {
      node.material = hair.material;
      node.castShadow = false;
    } else if (name.startsWith("SCALP")) node.material = scalp;
    else if (name.startsWith("TOP")) {
      node.material = top;
      tops[name.includes("TURTLE") ? "turtle" : "vneck"].push(node);
    } else if (name.startsWith("EARRINGS") || name.startsWith("NECKLACE")) {
      node.material = metal;
      jewelry.push(node);
    }
  });

  // Center on the bust so both models frame the same way.
  const offset = new THREE.Vector3();
  if (found.body) {
    const box = new THREE.Box3().setFromObject(found.body);
    box.getCenter(offset);
    offset.y = box.max.y - 0.17;
  }

  return { skin, eye, hair, scalp, top, metal, tops, jewelry, offset };
}

type Rig = ReturnType<typeof buildRig>;

function applyLook(rig: Rig, look: AvatarLook) {
  const { skin, eye, hair, scalp, top, metal, tops, jewelry } = rig;
  const u = skin.uniforms;
  const m = look.makeup;
  u.skinTone.value.set(look.skin);
  u.lipColor.value.set(m.lip);
  u.lipAmount.value = m.lipAmt;
  u.lipGloss.value = m.gloss;
  u.blushColor.value.set(m.blush);
  u.blushAmount.value = m.blushAmt;
  u.shadowColor.value.set(m.shadow);
  u.shadowAmount.value = m.shadowAmt;
  u.linerColor.value.set(m.liner);
  u.linerAmount.value = m.linerAmt;
  u.browColor.value.set(m.brow);
  u.browAmount.value = m.browAmt;
  u.contourColor.value.set(m.contour);
  u.contourAmount.value = m.contourAmt;
  eye.uniforms.irisColor.value.set(look.eyes);
  hair.uniforms.hairColor.value.set(look.hair);
  scalp.color.set(look.hair).multiplyScalar(0.6);
  top.color.set(look.top);
  metal.color.set(look.metalHex);
  tops.vneck.forEach((o) => (o.visible = look.neckline === "vneck"));
  tops.turtle.forEach((o) => (o.visible = look.neckline === "turtle"));
  jewelry.forEach((o) => {
    const name = o.name.toUpperCase();
    if (name.startsWith("EARRINGS")) o.visible = look.earrings;
    // The turtleneck covers the necklace, and the male necklace is a plain ring
    // that floats off the neck, so it stays hidden on the male model.
    else o.visible = look.necklace && look.neckline === "vneck" && look.gender === "female";
  });
}

export function Avatar({ look }: { look: AvatarLook }) {
  const { scene } = useGLTF(MODEL_URL[look.gender], DRACO_PATH);
  const [pack, normal] = useTexture(HAIR_TEXTURES[look.gender], (t) =>
    (Array.isArray(t) ? t : [t]).forEach(prepareTexture),
  );

  const rig = useMemo(() => buildRig(scene, pack, normal), [scene, pack, normal]);

  useEffect(() => applyLook(rig, look), [rig, look]);

  return (
    <group position={rig.offset.clone().negate()}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL.female, DRACO_PATH);
useGLTF.preload(MODEL_URL.male, DRACO_PATH);
