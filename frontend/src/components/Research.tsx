import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Define your target',
    description:
      'Choose a biological target and task type — classification (active/inactive), regression (IC50, Ki), or multi-task ADMET prediction.',
    color: 'text-athena-amber',
    borderColor: 'border-athena-amber/30',
  },
  {
    step: '02',
    title: 'Athena selects & prepares data',
    description:
      'Athena pulls relevant assay data, standardizes SMILES, removes duplicates, detects activity cliffs, and creates scaffold-aware train/test splits.',
    color: 'text-athena-orange',
    borderColor: 'border-athena-orange/30',
  },
  {
    step: '03',
    title: 'Automated featurization & training',
    description:
      'Multiple representations (fingerprints, descriptors, graph features) are generated. Models are trained in parallel with Bayesian hyperparameter optimization.',
    color: 'text-athena-red',
    borderColor: 'border-athena-red/30',
  },
  {
    step: '04',
    title: 'Evaluate with domain-aware metrics',
    description:
      'Models are evaluated using scaffold cross-validation, enrichment factors, and uncertainty quantification — metrics that matter for real drug discovery.',
    color: 'text-athena-purple',
    borderColor: 'border-athena-purple/30',
  },
  {
    step: '05',
    title: 'Benchmark & report',
    description:
      'Compare your results against published MoleculeNet baselines and generate reproducible reports ready for your team or publication.',
    color: 'text-athena-cyan',
    borderColor: 'border-athena-cyan/30',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-athena-purple">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            From target to benchmark in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-athena-text">
            Athena replaces weeks of manual ML engineering with a streamlined, automated
            workflow designed by drug discovery researchers.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-16 space-y-6">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`group flex flex-col gap-6 rounded-xl border ${item.borderColor} bg-athena-card/30 p-6 transition-colors hover:bg-athena-card/50 md:flex-row md:items-center`}
            >
              {/* Step number */}
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-athena-dark/80 font-mono text-lg font-bold ${item.color}`}>
                {item.step}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-athena-text">{item.description}</p>
              </div>

              {/* Arrow for desktop */}
              <ArrowRight size={20} className="hidden shrink-0 text-athena-text/30 transition-colors group-hover:text-athena-text md:block" />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex items-center justify-center gap-3 rounded-xl border border-athena-amber/20 bg-athena-amber/5 p-6"
        >
          <Lightbulb size={20} className="shrink-0 text-athena-amber" />
          <p className="text-sm text-athena-text">
            <span className="font-medium text-white">Pro tip:</span> Use{' '}
            <code className="rounded bg-athena-dark/80 px-1.5 py-0.5 font-mono text-xs text-athena-amber">
              athena run --auto
            </code>{' '}
            to let Athena choose the best configuration for your target automatically.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
