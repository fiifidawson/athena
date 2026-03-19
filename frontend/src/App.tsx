import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Pipeline from './components/Models';
import Platform from './components/Platform';
import HowItWorks from './components/Research';
import About from './components/Company';
import CTA from './components/CTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-athena-dark">
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
