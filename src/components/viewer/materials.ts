import * as THREE from "three";

// Ports of the Blender node setups in renk_analizi.blend. Blender RGB node
// values are linear, so constants below go through `new THREE.Color(r, g, b)`
// (no sRGB conversion); UI swatches are sRGB hex and go through `.set(hex)`.

type Uniforms = Record<string, THREE.IUniform>;

// The glTF exporter writes MakeupMask/MakeupMask2/EyeMask as COLOR_n, which
// three names `color`, `color_1`. We move them to our own names so three's
// vertex-color path never multiplies them into the diffuse colour.
export function remapMaskAttributes(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute("mask1")) return;
  const c0 = geometry.getAttribute("color");
  const c1 = geometry.getAttribute("color_1");
  if (c0) {
    geometry.setAttribute("mask1", c0);
    geometry.deleteAttribute("color");
  }
  if (c1) {
    geometry.setAttribute("mask2", c1);
    geometry.deleteAttribute("color_1");
  }
}

export function createSkinMaterial() {
  const uniforms: Uniforms = {
    skinTone: { value: new THREE.Color() },
    contourColor: { value: new THREE.Color(0.75, 0.62, 0.55) },
    contourAmount: { value: 0 },
    blushColor: { value: new THREE.Color(0.95, 0.4, 0.45) },
    blushAmount: { value: 0 },
    shadowColor: { value: new THREE.Color(0.45, 0.25, 0.35) },
    shadowAmount: { value: 0 },
    linerColor: { value: new THREE.Color(0.03, 0.02, 0.02) },
    linerAmount: { value: 0 },
    browColor: { value: new THREE.Color(0.06, 0.035, 0.02) },
    browAmount: { value: 0.85 },
    lipColor: { value: new THREE.Color(0.75, 0.05, 0.12) },
    lipAmount: { value: 0 },
    lipGloss: { value: 0.5 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.52,
    specularIntensity: 0.45,
    sheen: 0.2,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(1, 0.85, 0.8),
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute vec3 mask1;
        attribute vec3 mask2;
        varying vec3 vMask1;
        varying vec3 vMask2;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vMask1 = mask1;
        vMask2 = mask2;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vMask1;
        varying vec3 vMask2;
        uniform vec3 skinTone, contourColor, blushColor, shadowColor, linerColor, browColor, lipColor;
        uniform float contourAmount, blushAmount, shadowAmount, linerAmount, browAmount, lipAmount, lipGloss;`,
      )
      .replace(
        "#include <color_fragment>",
        `vec3 skin = skinTone;
        skin = mix(skin, skin * vec3(0.88, 0.66, 0.66), vMask1.r);
        skin *= mix(vec3(1.0), contourColor / max(skinTone, vec3(0.001)), clamp(vMask2.b * contourAmount, 0.0, 1.0) * 0.6);
        // Blush tints the skin instead of painting over it, so it stays natural on every tone.
        vec3 blushTint = blushColor / max(max(blushColor.r, blushColor.g), max(blushColor.b, 1e-3));
        skin = mix(skin, skin * blushTint * 1.06, vMask1.g * blushAmount);
        skin = mix(skin, shadowColor, vMask1.b * shadowAmount);
        skin = mix(skin, linerColor, vMask2.g * linerAmount);
        skin = mix(skin, browColor, vMask2.r * browAmount);
        skin = mix(skin, lipColor, vMask1.r * lipAmount);
        diffuseColor.rgb = skin;`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.16, vMask1.r * lipGloss * lipAmount);`,
      );
  };

  return { material, uniforms };
}

export function createEyeMaterial() {
  const uniforms: Uniforms = { irisColor: { value: new THREE.Color() } };
  const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute vec3 mask1;
        varying vec3 vMask1;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vMask1 = mask1;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vMask1;
        uniform vec3 irisColor;`,
      )
      .replace(
        "#include <color_fragment>",
        `vec3 iris = irisColor * (1.0 - 0.55 * vMask1.b);
        vec3 eye = mix(vec3(0.78, 0.75, 0.72), iris, vMask1.r);
        eye = mix(eye, vec3(0.008), vMask1.g);
        diffuseColor.rgb = eye;`,
      );
  };
  return { material, uniforms };
}

// Hair cards use a packed texture baked from the Blender textures:
// R = luminance of the base colour (sRGB encoded), G = alpha,
// B = root/ID shading divided by 1.15.
const HAIR_MEAN_LUMINANCE = 0.16;

export function createHairMaterial(pack: THREE.Texture, normal: THREE.Texture) {
  const uniforms: Uniforms = { hairColor: { value: new THREE.Color() } };
  const material = new THREE.MeshStandardMaterial({
    map: pack,
    normalMap: normal,
    roughness: 0.45,
    side: THREE.DoubleSide,
    alphaTest: 0.35,
    alphaToCoverage: true,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 hairColor;`,
      )
      .replace(
        "#include <map_fragment>",
        `vec4 hairPack = texture2D(map, vMapUv);
        float strand = pow(hairPack.r, 2.2) / ${HAIR_MEAN_LUMINANCE.toFixed(3)};
        diffuseColor.rgb = hairColor * strand * hairPack.b * 1.15;
        diffuseColor.a = hairPack.g;`,
      );
  };
  return { material, uniforms };
}

export function createScalpMaterial() {
  return new THREE.MeshStandardMaterial({ roughness: 0.65 });
}

export function createTopMaterial() {
  return new THREE.MeshPhysicalMaterial({
    roughness: 0.85,
    sheen: 0.5,
    sheenRoughness: 0.5,
    side: THREE.DoubleSide,
  });
}

export function createMetalMaterial() {
  return new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.22 });
}
