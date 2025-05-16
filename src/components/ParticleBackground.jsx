import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleBackground() {
  const cameraRef = useRef();

  return (
    <Canvas
      camera={{ position: [0, 35, 120], fov: 25 }}
      className="w-full h-full absolute top-0 left-0"
      onCreated={({ camera }) => { cameraRef.current = camera; }}
    >
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.7} />
      <CameraMouseController />
      <WaveField />
    </Canvas>
  );
}

// Controla la cámara con el mouse (eje X) y zoom con la rueda
function CameraMouseController() {
  const { mouse, camera, gl } = useThree();
  const targetX = useRef(camera.position.x);
  const targetZ = useRef(camera.position.z);

  // Zoom con la rueda del mouse
  useEffect(() => {
    function onWheel(e) {
      // Limita el zoom entre 80 y 160
      const next = THREE.MathUtils.clamp(targetZ.current + e.deltaY * 0.15, 80, 160);
      targetZ.current = next;
    }
    gl.domElement.addEventListener("wheel", onWheel);
    return () => gl.domElement.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame(() => {
    // Movimiento sutil en X
    const minX = -200;
    const maxX = 100;
    const desiredX = THREE.MathUtils.lerp(minX, maxX, (mouse.x + 1) / 2);
    targetX.current = THREE.MathUtils.lerp(targetX.current, desiredX, 0.04);

    // Movimiento suave en Z (zoom)
    camera.position.x = targetX.current;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ.current, 0.08);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function WaveField({
  lines = 40,         // Pocas líneas, bien separadas
  points = 600,
  width = 5,
  depth = 60,
  amplitude = 5,    // Más bajo para sutilidad
  speed = 0.5,        // Más lento
  frequency = 0.4,   // Frecuencia de la onda
}) {
  const meshRefs = useRef([]);
  const glowRefs = useRef([]);
  const { mouse } = useThree();

  // Estado para suavizar el mouse
  const mouseScene = useRef({ x: 0, z: 0 });

  const basePositions = useMemo(() => {
    const arr = [];
    for (let l = 0; l < lines; l++) {
      const z = ((l / (lines - 1)) - 0.5) * depth;
      const line = [];
      for (let p = 0; p < points; p++) {
        const x = ((p / (points - 1)) - 0.5) * width;
        line.push([x, 0, z]);
      }
      arr.push(line);
    }
    return arr;
  }, [lines, points, width, depth]);

  // Mouse en coordenadas de la escena, suavizado
  function getMouseWorld() {
    return [
      mouse.x * (width / 2),
      mouse.y * (depth / 2)
    ];
  }

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Suaviza el mouse en la escena
    const [mx, mz] = getMouseWorld();
    mouseScene.current.x = THREE.MathUtils.lerp(mouseScene.current.x, mx, 0.3);
    mouseScene.current.z = THREE.MathUtils.lerp(mouseScene.current.z, mz, 0.8);

    meshRefs.current.forEach((mesh, l) => {
      if (!mesh) return;
      const positions = mesh.geometry.attributes.position.array;
      for (let p = 0; p < points; p++) {
        const [x, , z] = basePositions[l][p];
        // Distancia al mouse
        const dist = Math.sqrt((x - mouseScene.current.x) ** 2 + (z - mouseScene.current.z) ** 2);
        // Influencia fuerte pero suave del mouse
        const mouseEffect = Math.exp(-dist * 0.08) * 1.2; // mayor radio e intensidad
        // Onda ripple + ruido + mouse
        const y = Math.sin(x * frequency + t * speed + l * 0.25) * amplitude
                + Math.sin(t * 0.2 + l) * 0.15
                + mouseEffect;
        positions[p * 3] = x;
        positions[p * 3 + 1] = y;
        positions[p * 3 + 2] = z;
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      // Opacidad dinámica para desvanecer/aparecer como viento
      const fade = 0.5 + 0.5 * Math.sin(t * 0.25 + l * 0.3);
      mesh.material.opacity = 0.08 + 0.22 * fade;
    });
    // Glow
    glowRefs.current.forEach((mesh, l) => {
      if (!mesh) return;
      const positions = mesh.geometry.attributes.position.array;
      for (let p = 0; p < points; p++) {
        const [x, , z] = basePositions[l][p];
        const dist = Math.sqrt((x - mouseScene.current.x) ** 2 + (z - mouseScene.current.z) ** 2);
        const mouseEffect = Math.exp(-dist * 0.08) * 0.6;
        const y = Math.sin(x * frequency + t * speed + l * 0.25) * amplitude
                + Math.sin(t * 0.2 + l) * 0.15
                + mouseEffect;
        positions[p * 3] = x;
        positions[p * 3 + 1] = y;
        positions[p * 3 + 2] = z;
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      const fade = 0.5 + 0.5 * Math.sin(t * 0.25 + l * 0.3);
      mesh.material.opacity = 0.04 + 0.12 * fade;
    });
  });

  return (
    <group>
      {/* Glow lines */}
      {basePositions.map((line, l) => (
        <line
          key={"glow-" + l}
          ref={el => glowRefs.current[l] = el}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(line.flat())}
              count={points}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#fff" linewidth={7} opacity={0.08} transparent />
        </line>
      ))}
      {/* Main lines */}
      {basePositions.map((line, l) => (
        <line
          key={l}
          ref={el => meshRefs.current[l] = el}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(line.flat())}
              count={points}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#fff" linewidth={1.2} opacity={0.18} transparent />
        </line>
      ))}
    </group>
  );
}
