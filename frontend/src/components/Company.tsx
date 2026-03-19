import { motion } from 'framer-motion';
import { Code2, FlaskConical, Brain, Microscope } from 'lucide-react';

const highlights = [
  {
    icon: FlaskConical,
    title: 'Built for drug discovery',
    description: 'Every design decision is informed by real pharmaceutical workflows — not generic ML tooling retrofitted for chemistry.',
  },
  {
    icon: Code2,
    title: 'Open source first',
    description: 'Athena is MIT licensed. Run it locally, contribute to the codebase, or extend it with your own models and datasets.',
  },
  {
    icon: Brain,
    title: 'Research-grade quality',
    description: 'Implements best practices from cheminformatics literature — scaffold splits, proper leakage prevention, and domain-aware metrics.',
  },
  {
    icon: Microscope,
    title: 'Production ready',
    description: 'From Jupyter notebooks to production APIs. Athena scales from quick experiments to full deployment with the same codebase.',
  },
];

const techStack = [
  'Python',
  'PyTorch',
  'RDKit',
  'PyTorch Geometric',
  'scikit-learn',
  'XGBoost',
  'Optuna',
  'MLflow',
  'FastAPI',
  'React',
];

export default function About() {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-athena-dark via-athena-darker to-athena-dark" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium uppercase tracking-wider text-athena-cyan">
            About
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Why Athena?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-athena-text">
            Drug discovery ML shouldn't require months of pipeline engineering. Athena
            gives researchers a battle-tested framework so they can focus on what matters — the science.
          </p>
        </motion.div>

        {/* Highlights */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-xl border border-athena-border bg-athena-card/30 p-6 transition-colors hover:border-athena-border/80"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-athena-amber/10">
                  <item.icon size={20} className="text-athena-amber" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-athena-text">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <h3 className="text-lg font-semibold text-white">Built with</h3>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-lg border border-athena-border bg-athena-card/30 px-4 py-2 text-sm text-athena-text-bright transition-colors hover:border-athena-amber/30"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
