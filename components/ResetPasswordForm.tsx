"use client";
import React, { useState } from "react";
import Link from "next/link";
import authService from "@/services/auth.service";

interface ResetPasswordFormProps {
  onSuccess: (email: string) => void;
}

export default function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      const response = await authService.requestPasswordReset(email);
      
      if (response.success) {
        onSuccess(email);
      } else {
        setError(response.message || "Произошла ошибка. Попробуйте снова.");
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/72 text-center mb-2 md:text-lg">Восстановление пароля</div>
      
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
            placeholder="Введите ваш email"
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
            required
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ КОД"}
        </button>
      </form>
      
      <div className="flex justify-center mt-4">
        <Link href="/" className="text-white/50 text-sm hover:text-white/80 transition-colors">
          Вернуться на страницу входа
        </Link>
      </div>
    </div>
  );
}
