import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import Button from '../ui/Button.jsx';
import { navLinks } from '../../data/content.js';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="nav__bar">
        <div className="nav__left">
          <Logo size="sm" to="/" />
          <nav className="nav__links" aria-label="Primary">
            {navLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
        </div>
        <div className="nav__right">
          <Link to="/auth?mode=login" className="nav__login">Log in</Link>
          <Button size="sm" onClick={() => navigate('/auth?mode=register')}>
            Get started <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </header>
  );
}

