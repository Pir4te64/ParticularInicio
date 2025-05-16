import React, { useState } from "react";
import StartButton from "./components/StartButton";
import ParticleBackground from "./components/ParticleBackground";

export default function App() {
  const [isWarping, setIsWarping] = useState(false);

  const handleStart = () => {
    setIsWarping(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <ParticleBackground isWarping={isWarping} />
      {!isWarping && <StartButton onClick={handleStart} />}
    </div>
  );
}
