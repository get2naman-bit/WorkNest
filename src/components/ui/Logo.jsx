import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import './Logo.css';

export default function Logo({ size = 'md', to }) {
  const content = (
    <>
      <span className="logo__mark">
        <Briefcase size={size === 'lg' ? 22 : size === 'sm' ? 15 : 18} strokeWidth={2.4} />
      </span>
      <span className="logo__word">
        Work<span>Nest</span>
      </span>
    </>
  );

  const className = `logo logo--${size}`;

  if (to) {
    return (
      <Link to={to} className={className} aria-label="WorkNest home">
        {content}
      </Link>
    );
  }

  return (
    <span className={className} aria-label="WorkNest">
      {content}
    </span>
  );
}
