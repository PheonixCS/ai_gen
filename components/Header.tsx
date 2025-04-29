import React from "react";
// Add this at the top of the file
export default function Header() {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="w-full max-w-[360px] md:max-w-[480px] pt-6 pb-4">
      <div className="flex justify-between items-center">
        <span className="text-sm">{currentTime}</span>
        <div className="flex space-x-4 items-center">
          {/* Wi-Fi icon with flex */}
          <div className="relative h-4 w-6 flex items-end justify-center space-x-0.5">
            <div className="h-1 w-1 bg-white rounded-sm"></div>
            <div className="h-2 w-1 bg-white rounded-sm"></div>
            <div className="h-3 w-1 bg-white rounded-sm"></div>
            <div className="h-4 w-1 bg-white rounded-sm"></div>
          </div>
          
          {/* Battery icon with flex */}
          <div className="flex items-center">
            <div className="h-3 w-6 border border-white rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-5 bg-white"></div>
            </div>
            <div className="h-2 w-0.5 bg-white ml-0.5"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
