import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const stages = [
  { label: 'Data Selection', color: 'var(--color-athena-amber)' },
  { label: 'Featurization', color: 'var(--color-athena-orange)' },
  { label: 'Model Training', color: 'var(--color-athena-red)' },
  { label: 'Evaluation', color: 'var(--color-athena-purple)' },
  { label: 'Benchmarking', color: 'var(--color-athena-cyan)' },
];

const terminalLines = [
  { text: 'Loading ChEMBL EGFR dataset (4,821 compounds)...', color: 'var(--color-athena-amber)' },
  { text: 'Generating molecular fingerprints & descriptors...', color: 'var(--color-athena-orange)' },
  { text: 'Training 12 models: RF, XGBoost, GNN, AttentiveFP...', color: 'var(--color-athena-red)' },
  { text: 'Cross-validation: best AUROC 0.923 (AttentiveFP)', color: 'var(--color-athena-purple)' },
  { text: 'Benchmark vs. baselines: +4.2% over MoleculeNet SOTA', color: 'var(--color-athena-cyan)' },
];

const STAGE_MS = 2500;
const DONE_HOLD_MS = 3000;
const RESET_MS = 1500;

export default function PipelineVisualization() {
  // -1 = reset, 0..4 = active stage, 5 = done/holding
  const [activeStage, setActiveStage] = useState(-1);

  useEffect(() => {
    const delay =
      activeStage < 0 ? RESET_MS
        : activeStage >= stages.length ? DONE_HOLD_MS
          : STAGE_MS;

    const timer = setTimeout(() => {
      setActiveStage((prev) => (prev >= stages.length ? -1 : prev + 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [activeStage]);

  const getStatus = (index: number) => {
    if (activeStage < 0) return 'pending';
    if (index < activeStage) return 'complete';
    if (index === activeStage) return 'active';
    return 'pending';
  };

  const progress = activeStage < 0 ? 0 : Math.min(activeStage / (stages.length - 1), 1);

  return (
    <div className="glow relative overflow-hidden rounded-xl md:rounded-2xl border border-athena-border bg-athena-card/80 p-1">
      <div className="rounded-lg md:rounded-xl bg-athena-darker/80 p-4 md:p-8 lg:p-12">

        {/* ── Desktop pipeline ── */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Track background — spans between first and last circle centers */}
            <div
              className="absolute top-5 h-0.5 rounded-full bg-athena-border"
              style={{ left: 20, right: 20 }}
            />

            {/* Track progress fill */}
            <motion.div
              className="absolute top-5 h-0.5 origin-left rounded-full"
              style={{
                left: 20,
                background:
                  'linear-gradient(90deg, var(--color-athena-amber), var(--color-athena-orange), var(--color-athena-red), var(--color-athena-purple), var(--color-athena-cyan))',
              }}
              animate={{
                width: `calc(${progress * 100}% - ${progress * 40}px)`,
              }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />

            {/* Stage nodes — evenly spaced */}
            <div className="relative flex justify-between">
              {stages.map((stage, i) => {
                const status = getStatus(i);
                return (
                  <div key={stage.label} className="flex flex-col items-center gap-2.5">
                    <motion.div
                      animate={{
                        scale: status === 'active' ? 1.1 : 1,
                        backgroundColor:
                          status !== 'pending'
                            ? stage.color
                            : 'var(--color-athena-border)',
                        boxShadow:
                          status === 'active'
                            ? `0 0 20px ${stage.color}`
                            : '0 0 0px transparent',
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full"
                    >
                      {status === 'complete' ? (
                        <svg
                          className="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold text-white">{i + 1}</span>
                      )}
                    </motion.div>
                    <motion.span
                      animate={{
                        color:
                          status === 'pending'
                            ? 'rgba(148, 163, 184, 0.5)'
                            : 'var(--color-athena-text-bright)',
                      }}
                      transition={{ duration: 0.4 }}
                      className="text-xs font-medium"
                    >
                      {stage.label}
                    </motion.span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Mobile pipeline (vertical) ── */}
        <div className="flex flex-col gap-3 md:hidden">
          {stages.map((stage, i) => {
            const status = getStatus(i);
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <motion.div
                  animate={{
                    backgroundColor:
                      status !== 'pending'
                        ? stage.color
                        : 'var(--color-athena-border)',
                  }}
                  transition={{ duration: 0.4 }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                >
                  {status === 'complete' ? (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold text-white">{i + 1}</span>
                  )}
                </motion.div>
                <span
                  className={`text-xs font-medium ${status === 'pending' ? 'text-athena-text/50' : 'text-athena-text-bright'}`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Terminal-style output — hidden on mobile */}
        <div className="mt-6 md:mt-10 hidden md:block rounded-lg border border-athena-border bg-athena-dark/80 p-4 font-mono text-xs md:text-sm">
          <div className="flex items-center gap-2 text-athena-text">
            <span className="text-athena-emerald">$</span>
            <span>athena run --dataset chembl_egfr --task classification --benchmark</span>
          </div>
          <div className="mt-2 space-y-1">
            {terminalLines.map((line, i) => {
              const visible = getStatus(i) !== 'pending';
              return (
                <div
                  key={line.text}
                  className="text-athena-text/70 transition-opacity duration-400 ease-out"
                  style={{ opacity: visible ? 1 : 0 }}
                >
                  <span style={{ color: line.color }}>→</span> {line.text}
                </div>
              );
            })}
          </div>
          <AnimatePresence>
            {activeStage >= stages.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-1 text-athena-emerald"
              >
                ✓ Pipeline complete — results saved to output/egfr_benchmark.json
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
