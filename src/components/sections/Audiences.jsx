import { Hammer, Briefcase, CheckCircle2 } from 'lucide-react';
import { workerBenefits, employerBenefits } from '../../data/content.js';
import './Audiences.css';

function Card({ tone, icon: Icon, title, items }) {
  return (
    <article className={`aud aud--${tone}`}>
      <Icon size={16} color="#1a6fe0" />
      <h2>{title}</h2>
      <ul>
        {items.map((t) => (
          <li key={t}><CheckCircle2 size={12} color="#1a6fe0" /> {t}</li>
        ))}
      </ul>
    </article>
  );
}

export default function Audiences() {
  return (
    <section className="audiences">
      <div className="container audiences__grid">
        <Card tone="plain" icon={Hammer} title="For workers" items={workerBenefits} />
        <Card tone="sand" icon={Briefcase} title="For employers" items={employerBenefits} />
      </div>
    </section>
  );
}
