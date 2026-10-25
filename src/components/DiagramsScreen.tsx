import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const DiagramsScreen: React.FC = () => {
  const { concepts, setCurrentScreen, setSelectedConceptId } = useApp();
  const [selectedConcept, setSelectedConcept] = useState('quantum-decoherence');
  const [entropyLevel, setEntropyLevel] = useState(65);

  return (
    <main className="max-w-2xl mx-auto pt-20 pb-36 px-gutter space-y-space-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
            Mental Model Visualizer
          </span>
          <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed">
            Intuitive Concept Schematics
          </h2>
        </div>
        <button
          onClick={() => {
            setSelectedConceptId(selectedConcept);
            setCurrentScreen('explain');
          }}
          className="text-label-md font-label-md text-primary dark:text-primary-fixed font-semibold flex items-center gap-1 hover:underline"
        >
          <span>Open Synthesis</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* Concept selector pills */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
        {concepts.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedConcept(c.id)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-label-sm font-label-sm transition-all ${
              selectedConcept === c.id
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'bg-surface-container dark:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Interactive Interactive Diagram Container */}
      {selectedConcept === 'quantum-decoherence' && (
        <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-5 space-y-4 shadow-[0px_2px_8px_rgba(24,24,27,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Interactive Phase Decoherence Simulation
            </h3>
            <span className="text-label-sm font-label-sm text-secondary font-bold bg-secondary/10 px-2.5 py-0.5 rounded-full">
              Environmental Entropy: {entropyLevel}%
            </span>
          </div>

          <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
            Drag the environmental noise slider below to observe how coherent quantum vectors
            scatter their relative phase angles into thermal degrees of freedom without energy
            decay:
          </p>

          {/* Interactive SVG Diagram */}
          <div className="w-full h-44 rounded-xl bg-surface-container-low dark:bg-surface-container flex items-center justify-center p-4 relative hairline-border overflow-hidden">
            <svg className="w-full h-full max-w-md" viewBox="0 0 400 120" fill="none">
              {/* Coherent Source State */}
              <g transform="translate(20, 20)">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="#1B2F6C"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  fill="#F0EEE8"
                  fillOpacity="0.4"
                />
                <line
                  x1="40"
                  y1="40"
                  x2="40"
                  y2="10"
                  stroke="#1B2F6C"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="40"
                  y1="40"
                  x2="65"
                  y2="25"
                  stroke="#1B2F6C"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text
                  x="40"
                  y="92"
                  fill="#1B2F6C"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="Plus Jakarta Sans"
                >
                  Pure Superposition
                </text>
              </g>

              {/* Scattering arrows influenced by entropyLevel */}
              <g transform="translate(130, 45)">
                <path
                  d="M 10 15 L 70 15"
                  stroke="#C25E34"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${entropyLevel > 50 ? '4 2' : 'none'}`}
                />
                <text
                  x="40"
                  y="0"
                  fill="#C25E34"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="Plus Jakarta Sans"
                >
                  ~10²³ Photons
                </text>
                <circle cx="25" cy="15" r="2" fill="#C25E34" />
                <circle cx="45" cy="8" r="2.5" fill="#C25E34" />
                <circle cx="55" cy="22" r="2" fill="#C25E34" />
              </g>

              {/* Dephased Target State */}
              <g transform="translate(240, 20)">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="#757681"
                  strokeWidth="1.5"
                  fill="#ffffff"
                  fillOpacity="0.9"
                />
                {/* Dynamically rotated scattered arrows */}
                <line
                  x1="40"
                  y1="40"
                  x2={40 + 25 * Math.cos((entropyLevel * 2 * Math.PI) / 100)}
                  y2={40 + 25 * Math.sin((entropyLevel * 2 * Math.PI) / 100)}
                  stroke="#9d431b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="40"
                  y1="40"
                  x2={40 + 25 * Math.cos((entropyLevel * 3 * Math.PI) / 100 + 1)}
                  y2={40 + 25 * Math.sin((entropyLevel * 3 * Math.PI) / 100 + 1)}
                  stroke="#757681"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="40"
                  y1="40"
                  x2={40 + 25 * Math.cos((entropyLevel * 4 * Math.PI) / 100 + 2)}
                  y2={40 + 25 * Math.sin((entropyLevel * 4 * Math.PI) / 100 + 2)}
                  stroke="#c5c5d1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="40"
                  y1="40"
                  x2={40 + 25 * Math.cos((entropyLevel * 5 * Math.PI) / 100 + 3)}
                  y2={40 + 25 * Math.sin((entropyLevel * 5 * Math.PI) / 100 + 3)}
                  stroke="#454650"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <text
                  x="40"
                  y="92"
                  fill="#757681"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="Plus Jakarta Sans"
                >
                  Statistical Mixture
                </text>
              </g>
            </svg>
          </div>

          {/* Interactive Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-outline font-label-sm">
              <span>0% Isolated (Vacuum)</span>
              <span>Poincaré Leakage Rate</span>
              <span>100% Macroscopic Decohered</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={entropyLevel}
              onChange={(e) => setEntropyLevel(Number(e.target.value))}
              className="w-full accent-secondary cursor-pointer"
            />
          </div>

          <div className="bg-surface-container-low dark:bg-surface-container p-3 rounded-lg hairline-border text-xs text-on-surface-variant flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed mt-0.5">
              info
            </span>
            <span>
              <strong>Feynman Key Insight:</strong> At {entropyLevel}% environmental entanglement,
              the density matrix off-diagonal elements decay exponentially in less than{' '}
              {entropyLevel > 20 ? '10⁻²³ seconds' : '10⁻¹² seconds'}. No wave collapse occurred —
              the phase information simply diffused across the room.
            </span>
          </div>
        </section>
      )}

      {selectedConcept === 'byzantine-fault-tolerance' && (
        <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-5 space-y-4 shadow-[0px_2px_8px_rgba(24,24,27,0.03)]">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Adversarial Consensus Network Schematic
          </h3>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Visualizing Lamport’s 3m + 1 theorem: How a network guarantees agreement even when m
            nodes deliberately transmit conflicting commands.
          </p>
          <div className="w-full py-6 px-4 bg-surface-container-low dark:bg-surface-container rounded-xl hairline-border flex flex-col gap-3 font-label-md text-xs">
            <div className="flex items-center justify-between p-3 bg-surface-container-lowest dark:bg-surface-container-lowest rounded-lg border border-primary/20">
              <span className="font-bold text-primary dark:text-primary-fixed">Commander Node</span>
              <span className="text-tertiary-container dark:text-tertiary-fixed font-semibold">
                Broadcasts: "ATTACK at DAWN"
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded bg-surface-container-lowest dark:bg-surface-container-lowest hairline-border">
                <span className="font-bold text-on-surface">Lieutenant A</span>
                <p className="text-[10px] text-outline mt-1">Received "ATTACK"</p>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest dark:bg-surface-container-lowest border border-dashed border-secondary">
                <span className="font-bold text-secondary">Traitor Node (B)</span>
                <p className="text-[10px] text-secondary mt-1">Broadcasts "RETREAT"</p>
              </div>
              <div className="p-2.5 rounded bg-surface-container-lowest dark:bg-surface-container-lowest hairline-border">
                <span className="font-bold text-on-surface">Lieutenant C</span>
                <p className="text-[10px] text-outline mt-1">Cross-validates majority</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedConcept === 'gradient-descent' && (
        <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-5 space-y-4 shadow-[0px_2px_8px_rgba(24,24,27,0.03)]">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Multidimensional Loss Valley Schematic
          </h3>
          <blockquote className="italic text-body-lg text-on-surface-variant p-3 bg-surface-container-low dark:bg-surface-container rounded-lg hairline-border">
            “Walking down a foggy alpine valley blindfolded, using only the tilt beneath your boots to
            step downhill.”
          </blockquote>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Computing the negative gradient -∇L(θ) determines the steepest downhill descent step,
            while momentum acts as heavy mass rolling past shallow local minima potholes.
          </p>
        </section>
      )}

      {selectedConcept === 'hebbian-plasticity' && (
        <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-5 space-y-4 shadow-[0px_2px_8px_rgba(24,24,27,0.03)]">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Synaptic Potentiation & Calcium Flow
          </h3>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            "Cells that fire together, wire together." Persistent depolarization ejects the Mg²⁺
            plug from NMDA receptors, enabling Ca²⁺ influx and exocytosis of additional AMPA
            receptors.
          </p>
        </section>
      )}
    </main>
  );
};
