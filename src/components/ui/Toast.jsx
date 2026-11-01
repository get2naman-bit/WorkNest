import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return createPortal(
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">
        {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </div>
      <div className="toast__text">{message}</div>
      <button className="toast__close" onClick={onClose} aria-label="Close notification">
        <X size={14} />
      </button>
    </div>,
    document.body
  );
}
