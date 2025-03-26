"use client";
import React, { useState } from "react";
import authService from "@/services/auth.service";

interface NewPasswordFormProps {
  email: string;
  verificationCode: string; // Add this prop
  onSuccess: () => void;
  onBack: () => void;
}

export default function NewPasswordForm({ email, verificationCode, onSuccess, onBack }: NewPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (newPassword.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log(`Changing password for ${email} with verification code: ${verificationCode}`);
      const response = await authService.resetPassword(email, newPassword, confirmPassword);
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || "Не удалось обновить пароль. Попробуйте снова.");
      }
    } catch (err) {
      setError("Произошла ошибка. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/72 text-center mb-2 md:text-lg">Новый пароль</div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input 
            type="password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Новый пароль"
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
            required
          />
        </div>
        
        <div className="relative">
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите пароль"
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
            required
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ ПАРОЛЬ"}
        </button>
      </form>
      
      <div className="flex justify-center mt-4">
        <button 
          onClick={onBack}
          className="text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          Назад
        </button>
      </div>
    </div>
  );
}
