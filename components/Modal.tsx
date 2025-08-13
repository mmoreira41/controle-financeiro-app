import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
                <X size={24} />
              </button>
            </div>
            <div>{children}</div>
        </div>
        {footer && <div className="bg-gray-800/50 backdrop-blur-sm rounded-b-lg border-t border-gray-700 px-6 py-4 flex justify-end space-x-3">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
