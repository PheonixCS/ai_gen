import React from "react";
import Image from "next/image";

export default function Title() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg md:text-2xl font-light">AI Photo Gen</h1>
      <div className="flex space-x-2">
        <Image 
          src="/logo.png" 
          alt="Logo" 
          width={32} 
          height={32} 
          className="w-8 h-8 object-contain"
        />
      </div>
    </div>
  );
}
