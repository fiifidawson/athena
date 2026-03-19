import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Subtle grid background */}
      <div className="grid-bg absolute inset-0" />

      {/* ── Text content ── */}
      <div className="relative z-20 mx-auto flex max-w-7xl flex-col items-center px-6 pt-32 lg:pt-40">
        {/* Badge */}
        <motion.a
          href="#pipeline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-2 rounded-full border border-athena-border/80 bg-athena-card/60 px-4 py-1.5 text-sm backdrop-blur-sm transition-colors hover:border-athena-amber/40"
        >
          <span className="rounded-full bg-athena-amber/20 px-2 py-0.5 text-xs font-medium text-athena-amber-light">
            Open Source
          </span>
          <span className="text-athena-text">End-to-end ML pipeline for drug discovery</span>
          <ArrowRight size={14} className="text-athena-text" />
        </motion.a>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-gradient-hero max-w-4xl text-center text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
        >
          AutoML for drug discovery
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-center text-lg text-athena-text md:text-xl"
        >
          From data selection to benchmarking — Athena automates your entire machine learning
          pipeline for molecular property prediction, compound screening, and hit optimization.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#platform"
            className="group flex items-center gap-2 rounded-xl bg-athena-amber px-6 py-3 font-medium text-white transition-all hover:bg-athena-amber-light hover:shadow-lg hover:shadow-athena-amber/25"
          >
            Start a pipeline
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#"
            className="flex items-center gap-2 rounded-xl border border-athena-border bg-athena-dark/40 px-6 py-3 font-medium text-athena-text-bright backdrop-blur-sm transition-all hover:border-athena-amber/50 hover:bg-athena-card/50"
          >
            <Github size={18} />
            View on GitHub
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-athena-border/50 bg-athena-card/30 px-8 py-6 backdrop-blur-sm md:gap-16"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white">5 Stages</div>
            <div className="mt-1 text-sm text-athena-text">Full pipeline coverage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">50+ Models</div>
            <div className="mt-1 text-sm text-athena-text">Built-in algorithms</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">ADMET</div>
            <div className="mt-1 text-sm text-athena-text">Property prediction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Open Source</div>
            <div className="mt-1 text-sm text-athena-text">MIT licensed</div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-athena-dark to-transparent" />
    </section>
  );
}
