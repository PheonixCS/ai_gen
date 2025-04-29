"use client";
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import CallbackContent from '@/components/payment/CallbackContent';

export default function ThreeDSCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-[#1A1A1A] rounded-xl p-6 w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-blue-500/10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
          <h1 className="text-xl font-medium text-white mb-2">
            Загрузка данных...
          </h1>
          <p className="text-white/70 mb-6">
            Пожалуйста, подождите
          </p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
