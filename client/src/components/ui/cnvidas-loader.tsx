import React from 'react';

interface CNVidasLoaderProps {
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const CNVidasLoader: React.FC<CNVidasLoaderProps> = ({ 
  fullScreen = false, 
  size = 'medium',
  text 
}) => {
  const sizes = {
    small: { container: 60, radius: 27.5, strokeWidth: 4, logo: 40 },
    medium: { container: 120, radius: 55, strokeWidth: 8, logo: 80 },
    large: { container: 180, radius: 82.5, strokeWidth: 12, logo: 120 }
  };

  const { container, radius, strokeWidth, logo } = sizes[size];
  const circumference = 2 * Math.PI * radius;

  const containerStyle = fullScreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f2f7 100%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)'
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column' as const
      };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes cnvidasCircleProgress {
            0% {
              stroke-dashoffset: ${circumference};
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          
          .cnvidas-base-circle {
            animation: cnvidasColorChange 4s linear infinite;
          }
          
          @keyframes cnvidasColorChange {
            0% {
              stroke: #3b82f6;
            }
            50% {
              stroke: #10b981;
            }
            100% {
              stroke: #3b82f6;
            }
          }
        `}
      </style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', margin: '0 auto', width: container, height: container }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: container, height: container, transform: 'rotate(-90deg)' }}>
            <circle
              cx={container / 2}
              cy={container / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {/* Círculo de base sempre visível */}
            <circle
              cx={container / 2}
              cy={container / 2}
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={strokeWidth}
              className="cnvidas-base-circle"
            />
            {/* Círculo animado */}
            <circle
              cx={container / 2}
              cy={container / 2}
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              style={{ animation: 'cnvidasCircleProgress 2s linear infinite' }}
            />
          </svg>
          
          {/* Logo no centro */}
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            width: logo, 
            height: logo 
          }}>
            <img 
              src="/assets/cnvidas-logo.png" 
              alt="CNVidas" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/logo.png';
              }}
            />
          </div>
        </div>
        {text && (
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>{text}</p>
        )}
      </div>
    </div>
  );
};