import { motion } from 'framer-motion';
import { Database, Cpu, FlaskConical, BarChart3, Trophy, ArrowRight } from 'lucide-react';
import PipelineVisualization from './PipelineVisualization';

const stages = [
  {
    name: 'Data Selection',
    badge: 'Stage 1',
    description:
      'Curate and prepare molecular datasets from ChEMBL, PubChem, or your own proprietary data. Automated cleaning, deduplication, and activity cliff detection.',
    features: [
      'ChEMBL & PubChem integration',
      'SMILES validation & standardization',
      'Activity cliff detection',
      'Scaffold-based splitting',
    ],
    icon: Database,
    color: 'athena-amber',
    gradient: 'from-athena-amber/10 to-transparent',
    borderColor: 'hover:border-athena-amber/40',
  },
  {
    name: 'Featurization',
    badge: 'Stage 2',
    description:
      'Transform molecules into ML-ready representations. From classical fingerprints to learned embeddings — pick the right features for your task.',
    features: [
      'Morgan / ECFP fingerprints',
      'RDKit molecular descriptors',
      'Graph neural network embeddings',
      'ADMET property features',
    ],
    icon: Cpu,
    color: 'athena-orange',
    gradient: 'from-athena-orange/10 to-transparent',
    borderColor: 'hover:border-athena-orange/40',
  },
  {
    name: 'Model Training',
    badge: 'Stage 3',
    description:
      'AutoML model selection and hyperparameter tuning across classical ML and deep learning architectures optimized for molecular data.',
    features: [
      'Random Forest, XGBoost, SVM',
      'GNN, AttentiveFP, SchNet',
      'Bayesian hyperparameter search',
      'Multi-task learning support',
    ],
    icon: FlaskConical,
    color: 'athena-red',
    gradient: 'from-athena-red/10 to-transparent',
    borderColor: 'hover:border-athena-red/40',
  },
  {
    name: 'Evaluation',
    badge: 'Stage 4',
    description:
      'Rigorous model evaluation with drug-discovery-aware metrics. Scaffold splits, temporal splits, and uncertainty quantification built in.',
    features: [
      'AUROC, AUPRC, enrichment factor',
      'Scaffold & temporal cross-validation',
      'Uncertainty quantification',
      'Applicability domain analysis',
    ],
    icon: BarChart3,
    color: 'athena-purple',
    gradient: 'from-athena-purple/10 to-transparent',
    borderColor: 'hover:border-athena-purple/40',
  },
  {
    name: 'Benchmarking',
    badge: 'Stage 5',
    description:
      'Compare your models against published baselines and MoleculeNet benchmarks. Generate reproducible reports with one command.',
    features: [
      'MoleculeNet benchmark suite',
      'Leaderboard comparison',
      'Reproducible experiment tracking',
      'Auto-generated reports',
    ],
    icon: Trophy,
    color: 'athena-cyan',
    gradient: 'from-athena-cyan/10 to-transparent',
    borderColor: 'hover:border-athena-cyan/40',
  },
];

const colorMap: Record<string, string> = {
  'athena-amber': 'text-athena-amber',
  'athena-orange': 'text-athena-orange',
  'athena-red': 'text-athena-red',
  'athena-purple': 'text-athena-purple',
  'athena-cyan': 'text-athena-cyan',
};

const bgColorMap: Record<string, string> = {
  'athena-amber': 'bg-athena-amber/10 text-athena-amber-light',
  'athena-orange': 'bg-athena-orange/10 text-athena-orange',
  'athena-red': 'bg-athena-red/10 text-athena-red',
  'athena-purple': 'bg-athena-purple/10 text-athena-purple',
  'athena-cyan': 'bg-athena-cyan/10 text-athena-cyan',
};

export default function Pipeline() {
  return (
    <section id="pipeline" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-athena-amber">
            The Pipeline
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Five stages. Zero guesswork.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-athena-text">
            Athena handles every step of the ML workflow for drug discovery — so you can
            focus on the science, not the engineering.
          </p>
        </motion.div>

        {/* Interactive pipeline demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16"
        >
          <PipelineVisualization />
        </motion.div>

        {/* Stage Cards — top row of 3, bottom row of 2 centered */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {stages.slice(0, 3).map((stage, i) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl border border-athena-border bg-athena-card/50 p-8 transition-colors ${stage.borderColor}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${stage.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-athena-dark/50 ${colorMap[stage.color]}`}>
                    <stage.icon size={24} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${bgColorMap[stage.color]}`}>
                    {stage.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{stage.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-athena-text">{stage.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {stage.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-athena-text">
                      <div className={`h-1.5 w-1.5 rounded-full bg-current ${colorMap[stage.color]}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href="#" className={`mt-8 inline-flex items-center gap-1.5 text-sm font-medium ${colorMap[stage.color]} transition-colors hover:text-white`}>
                  Learn more <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 md:mx-auto md:max-w-4xl">
          {stages.slice(3).map((stage, i) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i + 3) * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl border border-athena-border bg-athena-card/50 p-8 transition-colors ${stage.borderColor}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${stage.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-athena-dark/50 ${colorMap[stage.color]}`}>
                    <stage.icon size={24} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${bgColorMap[stage.color]}`}>
                    {stage.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{stage.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-athena-text">{stage.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {stage.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-athena-text">
                      <div className={`h-1.5 w-1.5 rounded-full bg-current ${colorMap[stage.color]}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href="#" className={`mt-8 inline-flex items-center gap-1.5 text-sm font-medium ${colorMap[stage.color]} transition-colors hover:text-white`}>
                  Learn more <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
