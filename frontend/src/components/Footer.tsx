function GitHubIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function Footer() {
  const footerLinks = {
    Pipeline: [
      { label: 'Data Selection', href: '#pipeline' },
      { label: 'Featurization', href: '#pipeline' },
      { label: 'Model Training', href: '#pipeline' },
      { label: 'Evaluation', href: '#pipeline' },
      { label: 'Benchmarking', href: '#pipeline' },
    ],
    Resources: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Tutorials', href: '#' },
      { label: 'Examples', href: '#' },
    ],
    Community: [
      { label: 'GitHub', href: 'https://github.com/fiifidawson/athena', external: true },
      { label: 'Discussions', href: '#' },
      { label: 'Contributing', href: '#' },
    ],
    Project: [
      { label: 'About', href: '#about' },
      { label: 'License', href: '#' },
    ],
  };

  return (
    <footer className="border-t border-athena-border bg-athena-darker">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Athena" className="h-8 w-8" />
              <span className="text-xl font-semibold text-white tracking-tight">athena.</span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-athena-text">
              Automated machine learning for drug discovery. From data selection to benchmarking.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white">{category}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...('external' in link && link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="text-sm text-athena-text transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-10 md:mt-16 flex flex-col items-center justify-between gap-4 border-t border-athena-border pt-6 md:pt-8 md:flex-row">
          <p className="text-xs text-athena-text/60">
            &copy; {new Date().getFullYear()} Athena. Open source under MIT License.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-athena-text/60 transition-colors hover:text-athena-text">
              License
            </a>
            <a href="#" className="text-xs text-athena-text/60 transition-colors hover:text-athena-text">
              Privacy
            </a>
            <a
              href="https://github.com/fiifidawson/athena"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-athena-text/60 transition-colors hover:text-athena-text"
            >
              <GitHubIcon size={12} />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
