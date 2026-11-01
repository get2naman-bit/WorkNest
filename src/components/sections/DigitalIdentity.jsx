import DashboardPreview from '../ui/DashboardPreview.jsx';
import { identityChips } from '../../data/content.js';
import './DigitalIdentity.css';

export default function DigitalIdentity() {
  return (
    <section className="identity" id="identity">
      <div className="container">
        <div className="identity__card">
          <div className="identity__copy">
            <p className="eyebrow">What makes WorkNest different</p>
            <h2 className="h2">A digital work identity</h2>
            <p className="lead">Not a job board. Every job completed through WorkNest adds to a permanent record — skills used, employers served, ratings earned. Experience stops being a story a worker tells and becomes their own.</p>
            <ul className="identity__chips">
              {identityChips.map((c) => (
                <li key={c.title}><strong>{c.title}</strong><span>{c.text}</span></li>
              ))}
            </ul>
          </div>
          <div className="identity__shot" aria-hidden="true">
            <DashboardPreview compact />
          </div>
        </div>
      </div>
    </section>
  );
}
