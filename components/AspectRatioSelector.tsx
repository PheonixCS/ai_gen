import { useState } from 'react';

type AspectRatio = '1:1' | '4:5' | '2:3' | '3:2' | '3:4' | '4:3';

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onSelectRatio: (ratio: AspectRatio) => void;
  className?: string;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ 
  selectedRatio, 
  onSelectRatio,
  className = '' 
}) => {
  // All available aspect ratios with their width/height values for display
  const ratios: { id: AspectRatio; width: number; height: number }[] = [
    { id: '1:1', width: 40, height: 40 },
    { id: '4:5', width: 40, height: 50 },
    { id: '2:3', width: 40, height: 60 },
    { id: '3:2', width: 60, height: 40 },
    { id: '3:4', width: 45, height: 60 },
    { id: '4:3', width: 60, height: 45 }
  ];

  return (
    <div className={`bg-[#151515] rounded-lg p-4 w-full max-w-3xl mx-auto ${className}`}>
      <div className="mb-2 text-xs text-white/70">Соотношение сторон</div>
      <div className="flex flex-wrap gap-4 justify-center">
        {ratios.map(ratio => (
          <button
            key={ratio.id}
            onClick={() => onSelectRatio(ratio.id)}
            className={`relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
              selectedRatio === ratio.id 
              ? 'opacity-100' 
              : 'opacity-70 hover:opacity-100'
            }`}
          >
            {/* Visual representation of the aspect ratio */}
            <div 
              className={`relative flex items-center justify-center ${
                selectedRatio === ratio.id ? 'p-[1px] rounded-lg' : ''
              }`}
              style={{ 
                background: selectedRatio === ratio.id 
                  ? 'linear-gradient(to right, #58E877, #FFFBA1)' 
                  : 'transparent' 
              }}
            >
              <div 
                className="bg-[#252525] rounded-lg flex items-center justify-center"
                style={{ 
                  width: ratio.width, 
                  height: ratio.height,
                }}
              >
                {/* Inner shape for contrast */}
                <div 
                  className="bg-[#333333] rounded-md"
                  style={{ 
                    width: ratio.width * 0.7, 
                    height: ratio.height * 0.7
                  }}
                ></div>
              </div>
            </div>
            <span className="text-xs text-center whitespace-nowrap">
              {ratio.id}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;