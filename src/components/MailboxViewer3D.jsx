import { useMemo, useEffect, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

THREE.ColorManagement.enabled = true;

// Couleurs marqueurs confirmées dans la console GLB
const MARKER_RED = new THREE.Color(1, 0, 0);
const MARKER_CYAN = new THREE.Color(0, 1, 1);
const MARKER_GREEN = new THREE.Color(0, 1, 0);
const MARKER_YELLOW = new THREE.Color(1, 1, 0);
const MARKER_GRAY = new THREE.Color(0.6, 0.6, 0.6);
const INOX_HEX = "#C0C0C0";
const TOLERANCE = 0.15;

// Le modèle SolidWorks est en mm → scale 0.01 ramène ~700 mm à ~7 unités
const MODEL_SCALE = 0.01;

function colorClose(a, b) {
  return (
    Math.abs(a.r - b.r) < TOLERANCE &&
    Math.abs(a.g - b.g) < TOLERANCE &&
    Math.abs(a.b - b.b) < TOLERANCE
  );
}

function getTargetColor(orig, coffre, cadre, portillon) {
  if (colorClose(orig, MARKER_RED)) return coffre;
  if (colorClose(orig, MARKER_CYAN)) return cadre;
  if (colorClose(orig, MARKER_GREEN)) return portillon;
  if (colorClose(orig, MARKER_YELLOW)) return INOX_HEX;
  return null;
}

// Couleurs trop sombres : ne pas assombrir davantage
const NO_DARKEN = new Set([
  "#1a2b6d", // RAL 5002
  "#1f3a2d", // RAL 6005
  "#383e42", // RAL 7016
  "#474a50", // RAL 7024
  "#1f1f1f", // RAL 9011
  "#442f29", // RAL 8017
  "#6c3b2a", // RAL 8012
]);

function applyDarken(hex) {
  if (NO_DARKEN.has(hex.toLowerCase())) return hex;
  const c = new THREE.Color(hex);
  c.multiplyScalar(0.75);
  return c;
}

function makeMaterial(color, isMetal) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: isMetal ? 0.2 : 0.55,
    metalness: isMetal ? 0.8 : 0.0,
    envMapIntensity: isMetal ? 1.0 : 0.6,
  });
}

function MailboxModel({ couleurCoffre, couleurCadre, couleurPortillon }) {
  const gltf = useGLTF("/elite_B4.glb");
  const { camera } = useThree();

  const { cloned, originals, radius } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const originals = new Map();

    cloned.traverse((obj) => {
      if (!obj.isMesh) return;

      const origColor = obj.material.color.clone();
      // Serrures (gris) et ailettes (jaune → inox) : matériau métal brossé
      const isMetal =
        colorClose(origColor, MARKER_GRAY) ||
        colorClose(origColor, MARKER_YELLOW);

      obj.material = makeMaterial(origColor, isMetal);
      obj.castShadow = true;
      obj.receiveShadow = true;

      originals.set(obj.uuid, origColor);
    });

    // Scale mm → unités Three.js avant le calcul de la bounding box
    cloned.scale.setScalar(MODEL_SCALE);
    cloned.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.position.sub(center);

    // Sphère englobante après centrage → distance caméra
    const box2 = new THREE.Box3().setFromObject(cloned);
    const sphere = new THREE.Sphere();
    box2.getBoundingSphere(sphere);

    return { cloned, originals, radius: sphere.radius };
  }, [gltf.scene]);

  // Positionne la caméra devant le modèle (Z positif = face avant)
  useEffect(() => {
    const fovRad = (camera.fov * Math.PI) / 180;
    const dist = (radius / Math.tan(fovRad / 2)) * 2.0;

    // Position : légèrement en hauteur, vue 3/4 face
    camera.position.set(dist * 0.35, dist * 0.25, dist);
    camera.near = radius * 0.01;
    camera.far = dist * 15;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, radius]);

  // Réapplique les couleurs RAL à chaque changement
  useEffect(() => {
    cloned.traverse((obj) => {
      if (!obj.isMesh || !originals.has(obj.uuid)) return;
      const orig = originals.get(obj.uuid);
      const target = getTargetColor(
        orig,
        couleurCoffre,
        couleurCadre,
        couleurPortillon,
      );
      if (target !== null) {
        obj.material.color.set(applyDarken(target));
      } else {
        obj.material.color.copy(orig);
      }
      obj.material.needsUpdate = true;
    });
  }, [cloned, originals, couleurCoffre, couleurCadre, couleurPortillon]);

  // rotation Y 180° pour orienter la face avant vers la caméra
  return (
    <group rotation={[0, Math.PI, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

export default function MailboxViewer3D({
  couleurCoffre,
  couleurCadre,
  couleurPortillon,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        position: "relative",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#f0f2f6"]} />

        <Environment preset="studio" backgroundIntensity={0} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[6, 10, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={100}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-4, 4, -4]} intensity={0.5} />

        <Suspense fallback={null}>
          <MailboxModel
            couleurCoffre={couleurCoffre}
            couleurCadre={couleurCadre}
            couleurPortillon={couleurPortillon}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={1}
          maxDistance={100}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/elite_B4.glb");
