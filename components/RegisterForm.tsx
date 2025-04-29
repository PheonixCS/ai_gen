"use client";
import React, { useState, useEffect } from "react";
import authService from "@/services/auth.service";

// Define props interface with the onSwitchToLogin callback
interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

// For development only - displays debug info
const DebugInfo = ({ show }: { show: boolean }) => {
  const [debugData, setDebugData] = useState<any>(null);
  
  useEffect(() => {
    if (show) {
      // @ts-ignore - getDebugInfo exists but TypeScript doesn't know about it
      const info = authService.getDebugInfo();
      setDebugData(info);
    }
  }, [show]);
  
  if (!show || !debugData) return null;
  
  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg text-xs">
      <h4 className="font-bold mb-2 text-white/70">Debug Info:</h4>
      <pre className="text-green-400 overflow-auto max-h-40">
        {JSON.stringify(debugData, null, 2)}
      </pre>
    </div>
  );
};

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  useEffect(() => {
    // Получаем текущий URL
    const currentUrl = new URL(window.location.href);
    // Проверяем наличие параметра utm_campaign
    const utmCampaign = currentUrl.searchParams.get('utm_campaign');
    
    // Если параметр присутствует, устанавливаем termsAccepted в true
    if (utmCampaign === 'partner_5percent') {
      setTermsAccepted(true);
    }
  }, []);
  // Проверка валидности email
  const validateEmail = (email: string) => {
    if (!email) return "Email обязателен";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Неверный формат email";
    return "";
  };
  
  // Проверка пароля
  const validatePassword = (password: string) => {
    if (!password) return "Пароль обязателен";
    if (password.length < 6) return "Пароль должен содержать минимум 6 символов";
    return "";
  };
  
  // Валидация всей формы
  const validateForm = () => {
    const errors = {
      email: validateEmail(email),
      password: validatePassword(password)
    };
    
    setFieldErrors(errors);
    
    // Возвращает true, если ошибок нет
    return !Object.values(errors).some(error => error !== "");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сбросить все ошибки
    setError("");
    setFieldErrors({});
    
    // Проверить форму перед отправкой
    if (!validateForm()) {
      return;
    }
    
    if (!termsAccepted) {
      setError("Необходимо принять условия использования");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log(`Submitting registration for ${email}`);
      
      // Step 1: Initialize registration - passing the same password value twice instead of confirmPassword
      const response = await authService.initiateRegistration(email, password, password);
      
      console.log("Registration initiated response:", response);
      
      if (response.success) {
        // Skip verification and directly register the user
        const registrationResponse = await authService.completeRegistration(email, "000000"); // Using dummy code to skip verification
        
        console.log("Registration completed response:", registrationResponse);
        
        if (registrationResponse.success) {
          // Redirect to home page on successful registration
          window.location.href = '/home';
        } else {
          setError(registrationResponse.message || "Ошибка при регистрации");
        }
      } else {
        setError(response.message || "Ошибка при регистрации");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Произошла ошибка при соединении с сервером. Пожалуйста, попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show debug info in development mode
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/72 text-center mb-2 md:text-lg">Регистрация аккаунта</div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Электронная почта"
            className={`w-full h-[42px] bg-[#151515] rounded-lg border ${fieldErrors.email ? 'border-red-500/50' : 'border-white/8'} text-white px-4 focus:outline-none focus:border-white/30 transition-colors`}
            required
          />
          {fieldErrors.email && (
            <div className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.email}</div>
          )}
        </div>
        
        <div className="relative">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className={`w-full h-[42px] bg-[#151515] rounded-lg border ${fieldErrors.password ? 'border-red-500/50' : 'border-white/8'} text-white px-4 focus:outline-none focus:border-white/30 transition-colors`}
            required
            minLength={6}
          />
          {fieldErrors.password && (
            <div className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.password}</div>
          )}
        </div>
        {!termsAccepted && (
        <div className="flex items-start gap-3 mt-2">
          <div className="relative w-5 h-5">
            <input 
              type="checkbox" 
              id="terms" 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="absolute opacity-0 w-5 h-5 cursor-pointer z-10"
            />
            <div className={`w-5 h-5 rounded-[1.67px] ${termsAccepted ? 'bg-[#F0F6F3]' : 'bg-transparent border border-white/30'}`}>
              {termsAccepted && (
                <svg 
                  className="absolute left-[17.56%] right-[17.57%] top-[26.46%] bottom-[26.44%]" 
                  width="13" 
                  height="13" 
                  viewBox="0 0 13 13" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M10.5 4L5.5 9L3 6.5" 
                    stroke="#0F0F0F" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <label htmlFor="terms" className={`text-sm transition-opacity duration-200 ${termsAccepted ? 'text-white/70' : 'text-white/40'}`}>
            Я согласен с <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline cursor-pointer ${termsAccepted ? 'text-white' : 'text-white/60'}`}
            >условиями использования</a> и <span className={`hover:underline cursor-pointer ${termsAccepted ? 'text-white' : 'text-white/60'}`}>Политикой конфиденциальности</span>
          </label>
        </div>
        )}
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "РЕГИСТРАЦИЯ..." : "ЗАРЕГИСТРИРОВАТЬСЯ"}
        </button>
      </form>
      
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-white/50 text-sm">Уже есть аккаунт?</span>
        <button 
          onClick={onSwitchToLogin}
          className="text-sm font-medium transition-colors bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1] hover:opacity-80"
        >
          Войти
        </button>
      </div>
      
      {/* Debug info in development mode */}
      {isDev && <DebugInfo show={false} />}
    </div>
  );
}
