"use client";
import Header from "@/components/Header";
import Title from "@/components/Title";
import LoginForm from "@/components/LoginForm";
import Footer from "@/components/Footer";
import ApiDebugger from "@/components/ApiDebugger";

export default function Login() {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="auth-layout bg-[#0F0F0F] text-white p-4">
      {/* Header with time and icons */}
      {/* <Header /> */}

      <div className="auth-container w-full flex flex-col gap-8 justify-center">
        {/* Title and volume indicators */}
        <Title />

        {/* Login form */}
        <LoginForm />
        
        {/* API Debugger - only shown in development */}
        {/* {isDev && <ApiDebugger />} */}
        
        {/* Additional info panel - visible only on desktop */}
        <div className="hidden md:flex flex-col gap-6 mt-6 bg-[#151515] rounded-lg p-6 border border-white/8">
          <h2 className="text-lg font-medium">Добро пожаловать!</h2>
          <p className="text-white/70">
            Войдите в свой аккаунт, чтобы получить доступ ко всем функциям 
            нашего ИИ-генератора изображений. Создавайте, редактируйте и 
            делитесь вашими уникальными фотографиями.
          </p>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#58E877]"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Footer with home indicator */}
      {/* <Footer /> */}
    </div>
  );
}
