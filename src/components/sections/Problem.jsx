import { problems } from '../../data/content.js';
import './Problem.css';

export default function Problem() {
  return (
    <section className="section problem" id="problem">
      <div className="container problem__grid">
        <div>
          <p className="eyebrow">The problem</p>
          <h2 className="h2">Experience exists. It just isn't visible.</h2>
          <p className="lead problem__lead">Informal work runs on word of mouth. When the referral chain breaks, years of skill disappear — and employers are left guessing who can actually do the job.</p>
        </div>
        <ul className="problem__list">
          {problems.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="problem__icon"><Icon size={15} color="#1a6fe0" /></span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
