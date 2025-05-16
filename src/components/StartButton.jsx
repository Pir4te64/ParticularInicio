import React from "react";

export default function StartButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                 px-8 py-4 bg-white text-black font-semibold rounded-lg shadow-lg
                 hover:scale-105 transition-all duration-300"
    >
      Start
    </button>
  );
}
