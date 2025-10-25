import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center space-x-3">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;