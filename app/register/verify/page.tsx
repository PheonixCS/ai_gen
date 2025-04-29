"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import authService from '@/services/auth.service';

// Component for the verification form that uses useSearchParams
function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Countdown for resend button
    if (remainingTime > 0 && !canResend) {
      const timer = setTimeout(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (remainingTime === 0 && !canResend) {
      setCanResend(true);
    }
  }, [remainingTime, canResend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!email) {
        setError('Email не найден. Пожалуйста, вернитесь на страницу регистрации.');
        setIsSubmitting(false);
        return;
      }

      // Complete registration with verification code
      const response = await authService.completeRegistration(email, verificationCode);
      
      if (response.success) {
        // Redirect to home page on successful verification
        router.replace('/home');
      } else {
        setError(response.message || 'Ошибка при подтверждении кода. Пожалуйста, проверьте код и попробуйте снова.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Произошла ошибка при соединении с сервером. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    try {
      if (!email) {
        setError('Email не найден. Пожалуйста, вернитесь на страницу регистрации.');
        return;
      }

      const response = await authService.sendVerificationCode(email);
      if (response.success) {
        setCanResend(false);
        setRemainingTime(60);
        alert('Новый код подтверждения отправлен на вашу почту.');
      } else {
        setError(response.message || 'Не удалось отправить код подтверждения.');
      }
    } catch (err) {
      console.error('Resend code error:', err);
      setError('Произошла ошибка при соединении с сервером. Пожалуйста, попробуйте позже.');
    }
  };

  // If no email, show error
  if (!email) {
    return (
      <div className="text-center mt-6">
        <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-2 rounded-lg text-sm mb-4">
          Email не найден. Пожалуйста, вернитесь на страницу регистрации.
        </div>
        <Link href="/register" className="text-white/80 hover:text-white transition-colors">
          Вернуться на страницу регистрации
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/72 text-center mb-2 md:text-lg">Подтверждение регистрации</div>
      
      <div className="text-white/60 text-center text-sm mb-2">
        Мы отправили код подтверждения на вашу почту: <span className="text-white font-medium">{email}</span>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input 
            type="text" 
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Введите код подтверждения"
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors text-center"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            inputMode="numeric"
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting || verificationCode.length !== 6}
          className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "ПРОВЕРКА..." : "ПОДТВЕРДИТЬ КОД"}
        </button>
      </form>
      
      <div className="text-center mt-2">
        {!canResend ? (
          <div className="text-white/50 text-sm">
            Отправить код повторно через: <span className="text-white">{remainingTime} сек</span>
          </div>
        ) : (
          <button 
            onClick={handleResendCode}
            className="text-white/70 text-sm hover:text-white transition-colors"
          >
            Отправить код повторно
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-center mt-6">
        <Link href="/register" className="text-white/50 text-sm hover:text-white/80 transition-colors">
          Вернуться на страницу регистрации
        </Link>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <div className="auth-layout bg-[#0F0F0F] text-white p-4">
      <div className="auth-container w-full flex flex-col gap-8 justify-center">
        <Suspense fallback={<div className="text-center">Загрузка...</div>}>
          <VerificationForm />
        </Suspense>
      </div>
    </div>
  );
}
