import { motion } from 'framer-motion';

const stages = [
  { label: 'Data Selection', color: 'bg-athena-amber', status: 'complete' },
  { label: 'Featurization', color: 'bg-athena-orange', status: 'complete' },
  { label: 'Model Training', color: 'bg-athena-red', status: 'active' },
  { label: 'Evaluation', color: 'bg-athena-purple', status: 'pending' },
  { label: 'Benchmarking', color: 'bg-athena-cyan', status: 'pending' },
];

export default function PipelineVisualization() {
  return (
    <div className="glow relative overflow-hidden rounded-2xl border border-athena-border bg-athena-card/80 p-1">
      <div className="rounded-xl bg-athena-darker/80 p-8 md:p-12">
        {/* Pipeline stages */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-0">
          {stages.map((stage, i) => (
            <div key={stage.label} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    stage.status === 'complete'
                      ? stage.color
                      : stage.status === 'active'
                        ? `${stage.color} animate-pulse`
                        : 'bg-athena-border'
                  }`}
                >
                  {stage.status === 'complete' ? (
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold text-white">{i + 1}</span>
                  )}
                </motion.div>
                <span className={`text-xs font-medium ${stage.status === 'pending' ? 'text-athena-text/50' : 'text-athena-text-bright'}`}>
                  {stage.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className="hidden h-0.5 w-full md:block">
                  <div className={`h-full ${stage.status === 'complete' ? 'bg-athena-amber/40' : 'bg-athena-border'}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Terminal-style output */}
        <div className="mt-10 rounded-lg border border-athena-border bg-athena-dark/80 p-4 font-mono text-xs md:text-sm">
          <div className="flex items-center gap-2 text-athena-text">
            <span className="text-athena-emerald">$</span>
            <span>athena run --dataset chembl_egfr --task classification --benchmark</span>
          </div>
          <div className="mt-2 space-y-1 text-athena-text/70">
            <div><span className="text-athena-amber">→</span> Loading ChEMBL EGFR dataset (4,821 compounds)...</div>
            <div><span className="text-athena-amber">→</span> Generating molecular fingerprints &amp; descriptors...</div>
            <div><span className="text-athena-red">→</span> Training 12 models: RF, XGBoost, GNN, AttentiveFP...</div>
            <div><span className="text-athena-purple">→</span> Cross-validation: best AUROC 0.923 (AttentiveFP)</div>
            <div><span className="text-athena-cyan">→</span> Benchmark vs. baselines: +4.2% over MoleculeNet SOTA</div>
          </div>
          <div className="mt-1 text-athena-emerald">
            ✓ Pipeline complete — results saved to output/egfr_benchmark.json
          </div>
        </div>
      </div>
    </div>
  );
}
