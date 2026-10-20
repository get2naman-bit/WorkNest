import { features } from '../../data/content.js';
import './Features.css';

export default function Features() {
  return (
    <section className="section features" id="features">
      <div className="container">
        <h2 className="h2">Everything hiring informally needs</h2>
        <ul className="features__grid">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="features__icon"><Icon size={14} color="#1a6fe0" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
