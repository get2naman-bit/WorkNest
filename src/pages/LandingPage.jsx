import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import Hero from '../components/sections/Hero.jsx';
import Problem from '../components/sections/Problem.jsx';
import Solution from '../components/sections/Solution.jsx';
import Features from '../components/sections/Features.jsx';
import HowItWorks from '../components/sections/HowItWorks.jsx';
import Audiences from '../components/sections/Audiences.jsx';
import DigitalIdentity from '../components/sections/DigitalIdentity.jsx';
import FinalCTA from '../components/sections/FinalCTA.jsx';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <HowItWorks />
        <Audiences />
        <DigitalIdentity />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
