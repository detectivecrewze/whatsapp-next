'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl toast border"
      style={{
        background: type === 'success' ? '#161b22' : '#210d0d',
        borderColor: type === 'success' ? 'var(--wa-green)' : 'var(--ui-danger)',
        color: '#fff',
      }}
    >
      {type === 'success' ? (
        <CheckCircle2 size={18} style={{ color: 'var(--wa-green)' }} />
      ) : (
        <AlertCircle size={18} style={{ color: 'var(--ui-danger)' }} />
      )}
      <span className="text-[13px] font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}
