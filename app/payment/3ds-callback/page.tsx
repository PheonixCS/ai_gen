"use client";
import { Suspense } from 'react';
import ThreeDsCallbackContent from '@/components/ThreeDsCallbackContent';

export default function ThreeDsCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <h1 className="text-xl font-medium">Подтверждение платежа</h1>
          <p className="mt-2 text-white/70">Загрузка...</p>
        </div>
      }>
        <ThreeDsCallbackContent />
      </Suspense>
    </div>
  );
}
