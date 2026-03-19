import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-athena-border"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-athena-amber/10 via-athena-dark to-athena-red/5" />
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-athena-amber/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-athena-red/10 blur-3xl" />

          <div className="relative px-8 py-16 text-center md:px-16 md:py-24">
            <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Ready to accelerate your drug discovery?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-athena-text">
              Stop reinventing ML pipelines. Start running experiments that matter.
              Athena is open source and ready to use.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                className="group flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-medium text-athena-dark transition-all hover:shadow-lg hover:shadow-white/10"
              >
                Get started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#"
                className="rounded-xl border border-white/20 px-8 py-3.5 font-medium text-white transition-all hover:bg-white/10"
              >
                Read the docs
              </a>
            </div>

            <div className="mt-10 rounded-lg border border-athena-border/50 bg-athena-dark/50 px-6 py-3 inline-block">
              <code className="font-mono text-sm text-athena-text">
                <span className="text-athena-emerald">$</span>{' '}
                <span className="text-athena-amber">pip install</span>{' '}
                <span className="text-white">athena-drug-discovery</span>
              </code>
            </div>

            <p className="mt-6 text-sm text-athena-text/60">
              Open source · MIT licensed · Python 3.9+
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
