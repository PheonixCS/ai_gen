"use client";
import Title from "@/components/Title";
import RegisterForm from "@/components/RegisterForm";

export default function Register() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-between p-4">
      <div className="w-full max-w-[360px] md:max-w-[480px] lg:max-w-[560px] flex flex-col gap-8 flex-grow justify-center">
        {/* Title and logo */}
        <Title />

        {/* Registration form */}
        <RegisterForm onSwitchToLogin={function (): void {
          throw new Error("Function not implemented.");
        } } />
        
        {/* Additional info panel - visible only on desktop */}
        <div className="hidden md:flex flex-col gap-6 mt-6 bg-[#151515] rounded-lg p-6 border border-white/8">
          <h2 className="text-lg font-medium">Создайте свой аккаунт!</h2>
          <p className="text-white/70">
            Регистрация позволит вам сохранять созданные изображения, 
            настраивать личные предпочтения и получать доступ ко всем 
            возможностям нашего сервиса.
          </p>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#58E877]"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
