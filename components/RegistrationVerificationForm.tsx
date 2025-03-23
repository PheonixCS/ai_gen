"use client";
import React, { useState, useRef, useEffect } from "react";
import authService from "@/services/auth.service";

interface RegistrationVerificationFormProps {
  email: string;
  onSuccess: () => void;
}

export default function RegistrationVerificationForm({ email, onSuccess }: RegistrationVerificationFormProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Load debug info in development mode
    if (process.env.NODE_ENV !== 'production') {
      try {
        // @ts-ignore - getDebugInfo exists but TypeScript doesn't know about it
        const info = authService.getDebugInfo();
        // setDebugInfo(info);
      } catch (err) {
        console.error("Error getting debug info:", err);
      }
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
      console.log(`Submitting verification code for ${email}: ${verificationCode}`);
      
      const response = await authService.completeRegistration(email, verificationCode);
      
      console.log("Complete registration response:", response);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || "Неверный код. Попробуйте снова.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Произошла ошибка при проверке кода. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setError("");
    
    try {
      console.log(`Resending verification code to ${email}`);
      
      const response = await authService.sendVerificationCode(email);
      
      console.log("Resend code response:", response);
      
      if (response.success) {
        setCountdown(60);
      } else {
        setError(response.message || "Не удалось отправить код. Попробуйте снова.");
      }
    } catch (err) {
      console.error("Resend code error:", err);
      setError("Произошла ошибка при отправке кода.");
    }
  };
  
  // Development mode hint - shows the verification code
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/72 text-center mb-2 md:text-lg">Подтверждение регистрации</div>
      
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
      
      {/* Debug info only in development mode */}
      {isDev && debugInfo && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg text-xs">
          <h4 className="font-bold mb-2 text-white/70">Debug Info:</h4>
          <p className="text-white/60 mb-2">В режиме разработки, проверьте консоль для проверочного кода.</p>
          <pre className="text-green-400 overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
