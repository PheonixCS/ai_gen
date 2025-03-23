"use client";
import React, { useState, useRef, useEffect } from "react";
import authService from "@/services/auth.service";

interface VerificationFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function VerificationForm({ email, onSuccess, onBack }: VerificationFormProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Countdown timer for resending code
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      const response = await authService.verifyCode(email, verificationCode);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || "Неверный код. Попробуйте снова.");
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setError("");
    
    try {
      const response = await authService.requestPasswordReset(email);
      
      if (response.success) {
        setCountdown(60);
      } else {
        setError(response.message || "Не удалось отправить код. Попробуйте снова.");
      }
    } catch (err) {
      setError("Произошла ошибка при отправке кода.");
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/72 text-center mb-2 md:text-lg">Подтверждение</div>
      
      <div className="text-white/50 text-sm text-center mb-2">
        Мы отправили код подтверждения на email: <span className="text-white">{email}</span>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input 
            ref={inputRef}
            type="text" 
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Код подтверждения"
            maxLength={6}
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors text-center tracking-widest"
            required
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting || verificationCode.length < 6}
          className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "ПРОВЕРКА..." : "ПОДТВЕРДИТЬ"}
        </button>
      </form>
      
      <div className="flex justify-center gap-2 text-sm">
        <button 
          onClick={handleResendCode}
          disabled={countdown > 0}
          className={`transition-colors ${countdown > 0 ? 'text-white/30' : 'text-white/50 hover:text-white/80'}`}
        >
          Отправить код повторно
          {countdown > 0 && <span> ({countdown}с)</span>}
        </button>
      </div>
      
      <div className="flex justify-center mt-4">
        <button 
          onClick={onBack}
          className="text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          Изменить email
        </button>
      </div>
    </div>
  );
}
