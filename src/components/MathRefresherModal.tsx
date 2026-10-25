import React from 'react';
import { useApp } from '../context/AppContext';

export const MathRefresherModal: React.FC = () => {
  const { isMathRefresherOpen, setIsMathRefresherOpen } = useApp();

  if (!isMathRefresherOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-surface-container-lowest dark:bg-surface-container-low rounded-2xl hairline-border p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container dark:border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-[22px]">
              functions
            </span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed">
              Formal Rigor Math Refresher
            </h3>
          </div>
          <button
            onClick={() => setIsMathRefresherOpen(false)}
            className="text-outline hover:text-on-surface p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 font-body-md text-on-surface leading-relaxed">
          <div className="p-3 bg-primary-fixed/30 dark:bg-primary-container/30 rounded-lg text-xs font-mono text-primary dark:text-primary-fixed font-semibold">
            ρ(t) = Tr_E [ e^(-i H t / ħ) (|ψ⟩⟨ψ| ⊗ |E_0⟩⟨E_0|) e^(i H t / ħ) ]
          </div>

          <p className="text-body-sm text-on-surface-variant">
            When a pure bipartite state evolves under total Hamiltonian <em>H = H_S + H_E + H_int</em>, tracing out the environmental bath coordinates <em>E</em> induces an off-diagonal decay in the reduced density matrix:
          </p>

          <p className="text-body-sm font-mono text-center py-2 bg-surface-container dark:bg-surface-container-high rounded text-primary dark:text-primary-fixed font-semibold">
            ρ_12(t) = ρ_12(0) · exp[-γ t |x_1 - x_2|²]  →  0
          </p>

          <p className="text-body-sm text-on-surface-variant">
            Because macroscopic separations <em>|x_1 - x_2|</em> are vast on atomic scales and the scattering collision rate <em>γ</em> with ambient air molecules exceeds 10²³ s⁻¹, the off-diagonal quantum coherences vanish on the order of <strong>10⁻²³ seconds</strong>. The system is left in an apparent diagonal mixed state with zero interference fringes, mimicking classical statistical reality.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsMathRefresherOpen(false)}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 active:scale-95 transition-transform"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
