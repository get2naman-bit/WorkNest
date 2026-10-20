import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import './FinalCTA.css';

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="cta">
      <div className="container cta__inner">
        <h2>Start building your work identity</h2>
        <p>Whether you're looking for your next job or your next hire, WorkNest gets you there.</p>
        <div className="cta__buttons">
          <Button size="lg" variant="light" onClick={() => navigate('/jobs')}>Find work</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/workers')}>Hire workers</Button>
        </div>
      </div>
    </section>
  );
}

