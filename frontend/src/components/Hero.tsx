import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

function GitHubIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Subtle grid background */}
      <div className="grid-bg absolute inset-0" />

      {/* ── Text content ── */}
      <div className="relative z-20 mx-auto flex max-w-7xl flex-col items-center px-4 pt-28 md:px-6 md:pt-32 lg:pt-40">
        {/* Badge */}
        <motion.a
          href="#pipeline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8 flex items-center gap-2 rounded-full border border-athena-border/80 bg-athena-card/60 px-3 py-1.5 text-xs md:text-sm md:px-4 backdrop-blur-sm transition-colors hover:border-athena-amber/40"
        >
          <span className="rounded-full bg-athena-amber/20 px-2 py-0.5 text-xs font-medium text-athena-amber-light">
            Open Source
          </span>
          <span className="hidden sm:inline text-athena-text">End-to-end ML pipeline for drug discovery</span>
          <span className="sm:hidden text-athena-text">ML for drug discovery</span>
          <ArrowRight size={14} className="text-athena-text" />
        </motion.a>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-gradient-hero max-w-4xl text-center text-3xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          AutoML for drug discovery
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 md:mt-6 max-w-2xl text-center text-base text-athena-text md:text-xl"
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
            href="https://github.com/fiifidawson/athena"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-athena-border bg-athena-dark/40 px-6 py-3 font-medium text-athena-text-bright backdrop-blur-sm transition-all hover:border-athena-amber/50 hover:bg-athena-card/50"
          >
            <GitHubIcon size={18} />
            View on GitHub
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 md:mt-16 grid grid-cols-2 gap-4 md:flex md:flex-wrap md:items-center md:justify-center md:gap-16 rounded-2xl border border-athena-border/50 bg-athena-card/30 px-5 py-5 md:px-8 md:py-6 backdrop-blur-sm"
        >
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-white">5 Stages</div>
            <div className="mt-0.5 md:mt-1 text-xs md:text-sm text-athena-text">Full pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-white">50+ Models</div>
            <div className="mt-0.5 md:mt-1 text-xs md:text-sm text-athena-text">Built-in algorithms</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-white">ADMET</div>
            <div className="mt-0.5 md:mt-1 text-xs md:text-sm text-athena-text">Property prediction</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-white">Open Source</div>
            <div className="mt-0.5 md:mt-1 text-xs md:text-sm text-athena-text">MIT licensed</div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-athena-dark to-transparent" />
    </section>
  );
}
