"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Wire() {
  const group = useRef<THREE.Group>(null!);
  const outer = useRef<THREE.Mesh>(null!);
  const inner = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.55) * 0.05;
      group.current.rotation.z = Math.sin(t * 0.32) * 0.035;
    }
    if (outer.current) {
      outer.current.rotation.x += delta * 0.08;
      outer.current.rotation.y += delta * 0.12;
    }
    if (inner.current) {
      inner.current.rotation.x -= delta * 0.05;
      inner.current.rotation.y -= delta * 0.09;
      inner.current.scale.setScalar(0.62 + Math.sin(t * 0.6) * 0.02);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={outer}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial color="#e0f2ff" wireframe transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.38} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Particles({ count = 120 }: { count?: number }) {
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
  const [ready, setReady] = useState(false);

  return (
    <div className="relative h-[420px] w-full lg:h-[520px]">
      {!ready && <HeroSceneFallback />}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          setReady(true);
        }}
        style={{ opacity: ready ? 1 : 0, transition: "opacity 180ms ease-out" }}
      >
        <Suspense fallback={null}>
          <Wire />
          <Particles />
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

function HeroSceneFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 52%, rgba(224,242,255,0.16), transparent 30%), radial-gradient(circle at 50% 50%, rgba(125,211,252,0.10), transparent 18%)",
      }}
    >
      <div className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-12 border border-white/35 shadow-[0_0_70px_rgba(224,242,255,0.12)]" />
      <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white/25" />
      <div className="absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-12 bg-white/30" />
      <div className="absolute left-1/2 top-1/2 h-px w-[52%] -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-white/24" />
      <div className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-sky-300/40" />
    </div>
  );
}
