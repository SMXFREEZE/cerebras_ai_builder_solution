"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

function Wire() {
  const outer = useRef<THREE.Mesh>(null!);
  const inner = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (outer.current) {
      outer.current.rotation.x += delta * 0.08;
      outer.current.rotation.y += delta * 0.12;
    }
    if (inner.current) {
      inner.current.rotation.x -= delta * 0.05;
      inner.current.rotation.y -= delta * 0.09;
      const t = state.clock.getElapsedTime();
      inner.current.scale.setScalar(0.62 + Math.sin(t * 0.6) * 0.02);
    }
  });

  return (
    <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.4}>
      <group>
        <Icosahedron ref={outer} args={[1.6, 1]}>
          <meshBasicMaterial color="#e0f2ff" wireframe transparent opacity={0.65} toneMapped={false} />
        </Icosahedron>
        <Icosahedron ref={inner} args={[1, 0]}>
          <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.35} toneMapped={false} />
        </Icosahedron>
      </group>
    </Float>
  );
}

function Particles({ count = 280 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.012,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.01;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

export function HeroScene() {
  return (
    <div className="relative h-[420px] w-full lg:h-[520px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Wire />
          <Particles />
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.55} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
            <Vignette eskil={false} offset={0.2} darkness={0.6} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 40%, rgba(10,10,10,0.6) 80%)",
        }}
      />
    </div>
  );
}
