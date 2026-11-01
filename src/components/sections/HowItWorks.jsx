import { steps } from '../../data/content.js';
import './HowItWorks.css';

export default function HowItWorks() {
  return (
    <section className="section how" id="how-it-works">
      <div className="container">
        <h2 className="h2">How it works</h2>
        <ol className="how__steps">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="how__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
