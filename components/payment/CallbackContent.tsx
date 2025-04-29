"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import payService from '@/services/pay.service';
import frontConfig from '@/config/api-config';
import authService from '@/services/auth.service';

export default function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Обработка платежа...');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Safe access to searchParams with null check
    const paRes = searchParams?.get('PaRes') || searchParams?.get('pares') || searchParams?.get('PARes') || '';
    const md = searchParams?.get('MD') || searchParams?.get('md') || '';
    
    console.log('3DS Callback parameters:', { paRes: paRes ? 'PRESENT' : 'MISSING', md });

    // Handle the 3DS verification
    async function process3DS() {
      if (paRes && md) {
        try {
          // Store in localStorage as fallback
          localStorage.setItem('3ds_result', JSON.stringify({
            paRes,
            md,
            timestamp: Date.now()
          }));

          // Call API to process 3DS verification
          const result = await payService.process3DSVerification({
            MD: md,
            PaRes: paRes,
            AppId: frontConfig.appId
          });

          if (result.success) {
            // Attempt to activate subscription
            try {
              await activateUserSubscription();
              setStatus('success');
              setMessage('Платеж успешно выполнен! Подписка активирована.');
            } catch (error) {
              console.error('Failed to activate subscription:', error);
              // Still mark as success even if activation fails
              setStatus('success');
              setMessage('Платеж успешно выполнен, но произошла ошибка при активации подписки.');
            }
          } else {
            setStatus('error');
            setMessage(result.message || 'Ошибка при 3DS верификации');
          }
        } catch (error) {
          console.error('Error during 3DS verification:', error);
          setStatus('error');
          setMessage('Произошла ошибка при обработке 3DS верификации');
        }
      } else {
        setStatus('error');
        setMessage('Не получены необходимые параметры 3DS верификации');
      }

      // Start countdown for redirect
      startCountdown();
    }

    // Start processing immediately
    process3DS();
  }, [searchParams]);

  // Function to activate subscription
  async function activateUserSubscription() {
    // Get current user email
    const currentUser = authService.getCurrentUser();
    if (!currentUser?.email) {
      throw new Error('User email not found');
    }
    
    // Get auth token
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch('/api/subscribe/manage.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'activate',
        token: token
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to activate subscription');
    }
    
    const result = await response.json();
    return result;
  }

  // Countdown and redirect
  function startCountdown() {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Redirect to profile page
          router.push('/profile');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl p-6 w-full max-w-md text-center">
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 
        ${status === 'success' ? 'bg-[#58E877]/10' : 
         status === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
        {status === 'processing' && (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        )}
        {status === 'success' && (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="#58E877" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {status === 'error' && (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6L18 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      
      <h1 className="text-xl font-medium text-white mb-2">
        {status === 'processing' ? 'Обработка платежа' : 
         status === 'success' ? 'Оплата успешна' : 'Ошибка при оплате'}
      </h1>
      
      <p className="text-white/70 mb-6">
        {message}
      </p>
      
      <p className="text-sm text-white/50">
        Перенаправление через {countdown} сек...
      </p>
      
      <div className="w-full h-1 bg-white/10 rounded mt-6">
        <div 
          className={`h-full ${status === 'success' ? 'bg-[#58E877]' : 
                            status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${((5 - countdown) / 5) * 100}%`, transition: 'width 1s linear' }}
        />
      </div>
    </div>
  );
}
