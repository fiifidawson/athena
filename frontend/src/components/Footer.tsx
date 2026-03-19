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
      { label: 'GitHub', href: '#' },
      { label: 'Discussions', href: '#' },
      { label: 'Contributing', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
    Project: [
      { label: 'About', href: '#about' },
      { label: 'Roadmap', href: '#' },
      { label: 'License', href: '#' },
    ],
  };

  return (
    <footer className="border-t border-athena-border bg-athena-darker">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="#" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-athena-amber to-athena-red">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">athena</span>
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
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-athena-border pt-8 md:flex-row">
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
            <a href="#" className="text-xs text-athena-text/60 transition-colors hover:text-athena-text">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
