import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import DashboardPreview from '../ui/DashboardPreview.jsx';
import HeroBackdrop from './HeroBackdrop.jsx';
import './Hero.css';

export default function Hero() {
  const [view, setView] = useState('worker');
  const navigate = useNavigate();

  return (
    <section className="hero" id="top">
      <HeroBackdrop />
      <div className="hero__content container">
        <span className="hero__badge"><CheckCircle2 size={12} color="#1a6fe0" /> Digital work identity, now for everyone</span>
        <h1>Work that counts</h1>
        <p>WorkNest connects informal workers with employers — and turns every completed job into proof of experience.</p>
        <div className="hero__cta">
          <Button size="lg" onClick={() => navigate('/jobs')}>Find work</Button>
          <Button size="lg" variant="light" onClick={() => navigate('/workers')}>Hire workers</Button>
        </div>

        <div className="hero__mock">
          <div className="hero__switch" role="tablist" aria-label="Preview view">
            <button role="tab" aria-selected={view === 'worker'} className={view === 'worker' ? 'is-active' : ''} onClick={() => setView('worker')}>Worker View</button>
            <button role="tab" aria-selected={view === 'employer'} className={view === 'employer' ? 'is-active' : ''} onClick={() => setView('employer')}>Employer View</button>
          </div>
          <DashboardPreview view={view} />
        </div>
      </div>
    </section>
  );
}

