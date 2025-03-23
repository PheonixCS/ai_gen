import React from "react";

interface RegistrationSuccessProps {
  onFinish: () => void;
}

export default function RegistrationSuccess({ onFinish }: RegistrationSuccessProps) {
  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="h-16 w-16 bg-[#58E877]/10 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="#58E877" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className="text-white/90 text-center text-xl font-medium">
        Регистрация успешно завершена!
      </div>
      
      <div className="text-white/60 text-center">
        Теперь вы можете войти в свой аккаунт, используя email и пароль, указанные при регистрации.
      </div>
      
      <button 
        onClick={onFinish}
        className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] mt-4"
      >
        ПЕРЕЙТИ НА СТРАНИЦУ ВХОДА
      </button>
    </div>
  );
}
