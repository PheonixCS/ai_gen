import React from 'react';

type AspectRatioType = '1:1' | '4:3' | '16:9' | '3:4' | '9:16';

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatioType;
  onSelectRatio: (ratio: AspectRatioType) => void;
  className?: string;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedRatio,
  onSelectRatio,
  className = '',
}) => {
  // Updated aspect ratios based on API documentation
  const aspectRatios: { ratio: AspectRatioType; label: string }[] = [
    { ratio: '1:1', label: 'Квадрат' },
    { ratio: '4:3', label: 'Альбомная' },
    { ratio: '16:9', label: 'Широкая' },
    { ratio: '3:4', label: 'Портретная' },
    { ratio: '9:16', label: 'Вертикальная' },
  ];

  return (
    <div className={`absolute left-0 right-0 bottom-[22px] bg-[#0F0F0F] border-t border-b border-white/10 py-3 z-10 ${className}`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-center space-x-4">
          {aspectRatios.map((item) => (
            <button
              key={item.ratio}
              onClick={() => onSelectRatio(item.ratio)}
              className={`flex flex-col items-center justify-center w-12 h-14 rounded-md transition-all ${
                selectedRatio === item.ratio
                  ? 'bg-white/10 border border-[#58E877]/40'
                  : 'bg-white/5 border border-transparent hover:bg-white/8'
              }`}
            >
              {/* Aspect ratio visualization */}
              <div 
                className={`bg-white/50 ${
                  item.ratio === '1:1' ? 'w-6 h-6' : 
                  item.ratio === '4:3' ? 'w-6 h-4.5' : 
                  item.ratio === '16:9' ? 'w-6 h-3.5' : 
                  item.ratio === '3:4' ? 'w-4.5 h-6' : 
                  'w-3.5 h-6' // 9:16
                }`}
              />
              <span className="text-xs mt-1">{item.ratio}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AspectRatioSelector;