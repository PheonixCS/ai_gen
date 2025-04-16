"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ThreeDsCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Add null check for searchParams
    if (!searchParams) {
      console.error('Search parameters are not available');
      return;
    }
    
    // Get the parameters from the URL
    const paRes = searchParams.get('PaRes');
    const md = searchParams.get('MD'); // Transaction ID

    if (paRes && md) {
      // Send a message to the parent window with the 3DS result
      if (window.opener) {
        window.opener.postMessage({ paRes, md }, window.location.origin);
        window.close();
      } else {
        // If not opened in a new window, send message to parent
        window.parent.postMessage({ paRes, md }, window.location.origin);
      }

      // Redirect back to the payment page after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    }
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-xl font-medium">Подтверждение платежа</h1>
      <p className="mt-2 text-white/70">Пожалуйста, не закрывайте эту страницу...</p>
    </div>
  );
}
