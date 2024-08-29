import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[2] bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative flex flex-col items-center justify-center translate-y-[20%] w-[90vw] h-[90vw] bg-[#E7E7E7] p-[10vw] rounded-[8vw] border-[0.5vw] border-[#333333] " onClick={(e) => e.stopPropagation()}>
        <span className="icon-[system-uicons--cross] absolute top-2 right-2 text-black text-[10vw] " onClick={onClose}></span>
        {children}
      </div>
    </div>
  );
};

export default Modal;