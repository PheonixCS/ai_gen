"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionCardProps {
  onClose: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ onClose }) => {
  const router = useRouter();

  const handlePlanSelection = () => {
    // Navigate to payment page
    router.push('/payment');
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl max-w-md mx-auto">
      <div className="text-white font-medium mb-3 text-center">
        Для неограниченного доступа оформите PRO подписку
      </div>
      
      <button 
        onClick={handlePlanSelection}
        className="w-full py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium text-center text-sm sm:text-base transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Активировать PRO доступ
      </button>
      
      <button 
        onClick={onClose}
        className="mt-3 text-white/50 text-sm"
      >
        Отмена
      </button>
    </div>
  );
};

export default SubscriptionCard;