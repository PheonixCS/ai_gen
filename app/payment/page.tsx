"use client";
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import PaymentClient from '@/components/PaymentClient';

// Simple loader component for Suspense fallback
function PaymentLoader() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        <p className="mt-4 text-white/70">Загрузка...</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoader />}>
      <PaymentClient />
    </Suspense>
  );
}
