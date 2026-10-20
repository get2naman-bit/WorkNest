export default function HeroBackdrop({ src = '/hero-bg.png' }) {
  return (
    <div className="hero__backdrop-container">
      <img src={src} alt="Hero Background" className="hero__backdrop-image" />
      <div className="hero__backdrop-overlay" />
    </div>
  );
}

