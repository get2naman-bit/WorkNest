import Logo from '../ui/Logo.jsx';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <Logo size="sm" to="/" />
        <p>© 2026 WorkNest. Work that counts.</p>
      </div>
    </footer>
  );
}
