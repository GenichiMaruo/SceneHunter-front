import React from 'react';

const ErrorMessage = ({ message, duration = 3000, onClose }) => {
  return (
    <div className="error-message">
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default ErrorMessage;