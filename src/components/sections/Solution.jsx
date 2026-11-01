import { solutionPoints } from '../../data/content.js';
import './Solution.css';

export default function Solution() {
  return (
    <section className="section solution">
      <div className="container solution__inner">
        <p className="eyebrow">The solution</p>
        <h2 className="h2">One platform for workers, employers, jobs and history</h2>
        <p className="lead">WorkNest brings hiring and working into the same place. Workers build a profile that grows with every job. Employers post roles and see verified history instead of promises.</p>
        <ul className="solution__points">
          {solutionPoints.map((p) => (
            <li key={p.title}><strong>{p.title}</strong><span>{p.text}</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
