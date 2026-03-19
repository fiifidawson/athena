import { motion } from 'framer-motion';
import { Workflow, Target, BarChart3, Settings2 } from 'lucide-react';

const capabilities = [
  {
    icon: Target,
    title: 'Target-Aware Pipelines',
    description:
      'Define your biological target and Athena selects the best datasets, features, and model architectures for your specific drug discovery task.',
    color: 'text-athena-amber',
    bgColor: 'bg-athena-amber/10',
  },
  {
    icon: Workflow,
    title: 'One-Click AutoML',
    description:
      'Launch complete experiments with a single command. Athena handles splitting, featurization, training, and evaluation automatically.',
    color: 'text-athena-emerald',
    bgColor: 'bg-athena-emerald/10',
  },
  {
    icon: BarChart3,
    title: 'Reproducible Benchmarks',
    description:
      'Compare against MoleculeNet and published baselines with controlled experiments. Every run is logged and reproducible.',
    color: 'text-athena-cyan',
    bgColor: 'bg-athena-cyan/10',
  },
  {
    icon: Settings2,
    title: 'Fully Configurable',
    description:
      'Override any stage of the pipeline. Swap models, add custom featurizers, or plug in your own datasets with a simple YAML config.',
    color: 'text-athena-purple',
    bgColor: 'bg-athena-purple/10',
  },
];

export default function Platform() {
  return (
    <section id="platform" className="relative py-16 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-athena-dark via-athena-darker to-athena-dark" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-athena-emerald">
            Platform
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Your drug discovery command center
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg text-athena-text">
            Athena gives you a visual dashboard and CLI to manage experiments, track results,
            and iterate on models — all from one place.
          </p>
        </motion.div>

        {/* Platform Preview — hidden on mobile (too complex for small screens) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 hidden md:block overflow-hidden rounded-2xl border border-athena-border glow"
        >
          <div className="bg-athena-card/80 p-1">
            <div className="rounded-xl bg-athena-darker/80">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-athena-border px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-4 text-xs text-athena-text">Athena — EGFR Inhibitor Campaign</span>
              </div>

              <div className="grid gap-px bg-athena-border md:grid-cols-3">
                {/* Sidebar */}
                <div className="bg-athena-darker p-6">
                  <div className="text-xs font-medium uppercase tracking-wider text-athena-text/60">
                    Experiments
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      { name: 'EGFR Classification', status: 'active' },
                      { name: 'hERG Toxicity', status: 'complete' },
                      { name: 'Solubility Regression', status: 'complete' },
                      { name: 'BBB Permeability', status: 'pending' },
                      { name: 'Multi-task ADMET', status: 'pending' },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          item.status === 'active'
                            ? 'bg-athena-amber/10 text-athena-amber-light'
                            : 'text-athena-text hover:text-athena-text-bright'
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === 'complete'
                              ? 'bg-athena-emerald'
                              : item.status === 'active'
                                ? 'bg-athena-amber'
                                : 'bg-athena-text/30'
                          }`}
                        />
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="bg-athena-darker p-6 md:col-span-2">
                  <div className="text-sm font-medium text-white">EGFR Classification</div>
                  <div className="mt-1 text-xs text-athena-text">
                    4,821 compounds · Binary activity · Scaffold split
                  </div>

                  {/* Model leaderboard */}
                  <div className="mt-6 rounded-lg border border-athena-border bg-athena-dark/50 p-4">
                    <div className="text-xs font-medium text-athena-text/60">MODEL LEADERBOARD</div>
                    <div className="mt-3 space-y-2.5">
                      {[
                        { model: 'AttentiveFP', auroc: '0.923', auprc: '0.891', status: 'best' },
                        { model: 'XGBoost + ECFP', auroc: '0.908', auprc: '0.874', status: '' },
                        { model: 'GCN', auroc: '0.901', auprc: '0.862', status: '' },
                        { model: 'Random Forest', auroc: '0.886', auprc: '0.847', status: '' },
                        { model: 'SVM (RBF)', auroc: '0.871', auprc: '0.831', status: '' },
                      ].map((row, idx) => (
                        <div key={row.model} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 text-center font-mono ${idx === 0 ? 'text-athena-amber' : 'text-athena-text/50'}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-mono ${idx === 0 ? 'text-white' : 'text-athena-text-bright'}`}>
                              {row.model}
                            </span>
                            {row.status === 'best' && (
                              <span className="rounded bg-athena-amber/20 px-1.5 py-0.5 text-[10px] font-medium text-athena-amber">
                                BEST
                              </span>
                            )}
                          </div>
                          <div className="flex gap-6">
                            <span>
                              <span className="text-athena-text/50">AUROC </span>
                              <span className={idx === 0 ? 'text-athena-amber' : 'text-athena-text-bright'}>{row.auroc}</span>
                            </span>
                            <span>
                              <span className="text-athena-text/50">AUPRC </span>
                              <span className={idx === 0 ? 'text-athena-emerald' : 'text-athena-text-bright'}>{row.auprc}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs">
                        <span className="text-athena-text">Pipeline Progress</span>
                        <span className="text-athena-amber-light">Training (3/5 stages)</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-athena-border">
                        <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-athena-amber to-athena-red" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Capabilities */}
        <div className="mt-10 md:mt-20 grid gap-4 md:gap-6 md:grid-cols-2">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-athena-border bg-athena-card/30 p-5 md:p-8 transition-colors hover:border-athena-border/80"
            >
              <div className={`inline-flex rounded-xl p-3 ${cap.bgColor}`}>
                <cap.icon size={24} className={cap.color} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{cap.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-athena-text">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
