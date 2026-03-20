import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Pipeline from './components/Models';
import Platform from './components/Platform';
import HowItWorks from './components/Research';
import About from './components/Company';
import CTA from './components/CTA';
import Footer from './components/Footer';
import UnderConstruction from './components/UnderConstruction';

function App() {
  const [underConstruction, setUnderConstruction] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor?.getAttribute('href') === '#') {
        e.preventDefault();
        setUnderConstruction(true);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="min-h-screen bg-athena-dark">
      {underConstruction && (
        <UnderConstruction onBack={() => setUnderConstruction(false)} />
      )}
      <Navbar />
      <Hero />
      <Pipeline />
      <Platform />
      <HowItWorks />
      <About />
      <CTA />
      <Footer />
    </div>
  );
}

export default App;
