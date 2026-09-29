import React, { useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center mb-3 font-mono-num text-amber-400 font-semibold">
          ₹
        </div>
        <span className="text-sm font-medium text-slate-100 max-w-xs">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
