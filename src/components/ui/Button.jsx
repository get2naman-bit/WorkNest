import './Button.css';

export default function Button({ variant = 'dark', size = 'md', children, ...props }) {
  return (
    <button className={`btn btn--${variant} btn--${size}`} {...props}>
      {children}
    </button>
  );
}
