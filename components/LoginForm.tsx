"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import authService from "@/services/auth.service";
import { useRouter } from "next/navigation";
import apiClient from "@/services/api-client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Disable proxy for testing
  useEffect(() => {
    // This is a temporary fix for testing - disable to use direct API calls
    apiClient.enableProxy(false);
  }, []);

  // Check if already logged in
  useEffect(() => {
    // При загрузке компонента проверяем наличие юзера в localStorage
    console.log('Checking localStorage for user:', localStorage.getItem('user'));
    
    if (authService.isAuthenticated()) {
      console.log('User is authenticated, redirecting to home');
      router.replace('/home');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Development login shortcut (optional, can be removed in production)
      if (process.env.NODE_ENV === 'development' && email === 'test@example.com' && password === 'test123') {
        setTimeout(() => {
          const user = { email: 'test@example.com', token: 'test-token' };
          localStorage.setItem('user', JSON.stringify(user));
          console.log('Test user saved to localStorage:', JSON.stringify(user));
          router.push('/home');
        }, 800);
        return;
      }

      console.log(`Attempting login for ${email}`);
      const response = await authService.login(email, password);
      console.log('Login response:', response);
      
      if (response.success) {
        // Проверяем, что данные сохранились в localStorage
        console.log('Login successful, checking localStorage:', localStorage.getItem('user'));
        
        // Небольшая задержка, чтобы убедиться, что данные сохранились
        setTimeout(() => {
          // Redirect to home page after successful login
          console.log('Redirecting to home page');
          router.push('/home');
        }, 100);
      } else {
        console.log('Login failed:', response.message);
        setError(response.message || "Ошибка при входе. Проверьте email и пароль.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Произошла ошибка при соединении с сервером. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/72 text-center mb-2 md:text-lg">Вход по Email</div>
      
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
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
            required
          />
        </div>
        
        <div className="relative">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
            required
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "ВХОД..." : "ВОЙТИ"}
        </button>
      </form>
      
      <div className="flex justify-center">
        <Link href="/reset-password" className="text-white/50 text-sm hover:text-white/80 transition-colors">
          Забыли пароль?
        </Link>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-white/50 text-sm">Нет аккаунта?</span>
        <Link href="/register" className="text-sm font-medium transition-colors bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1] hover:opacity-80">
          Зарегистрироваться
        </Link>
      </div>
      
      {/* <div className="flex items-center justify-center mt-6">
        <Link href="/" className="text-white/50 text-sm hover:text-white/80 transition-colors">
          Вернуться на главную страницу
        </Link>
      </div> */}
    </div>
  );
}
