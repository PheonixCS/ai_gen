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
    <div className={`py-3 px-4 ${className}`}>
      <div className="font-medium mb-3 text-sm text-white/80">Формат изображения</div>
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {aspectRatios.map((item) => (
          <button
            key={item.ratio}
            onClick={() => onSelectRatio(item.ratio)}
            className={`flex flex-col items-center min-w-[64px] rounded-md p-2 transition-all ${
              selectedRatio === item.ratio
                ? 'bg-white/10 border border-[#58E877]/40'
                : 'bg-white/5 border border-transparent hover:bg-white/8'
            }`}
          >
            {/* Aspect ratio visualization */}
            <div 
              className={`w-12 mb-2 bg-white/30 ${
                item.ratio === '1:1' ? 'h-12' : 
                item.ratio === '4:3' ? 'h-9' : 
                item.ratio === '16:9' ? 'h-[6.75px]' : 
                item.ratio === '3:4' ? 'h-16' : 
                'h-[21.33px]' // 9:16
              }`}
            />
            <span className="text-xs">{item.label}</span>
            <span className="text-[10px] text-white/50">{item.ratio}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;