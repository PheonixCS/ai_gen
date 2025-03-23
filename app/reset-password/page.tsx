"use client";
import { useState } from "react";
import Title from "@/components/Title";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import VerificationForm from "@/components/VerificationForm";
import NewPasswordForm from "@/components/NewPasswordForm";
import ResetSuccess from "@/components/ResetSuccess";

type ResetStep = 'email' | 'verification' | 'new-password' | 'success';

export default function ResetPassword() {
  const [currentStep, setCurrentStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-between p-4">
      <div className="w-full max-w-[360px] md:max-w-[480px] lg:max-w-[560px] flex flex-col gap-8 flex-grow justify-center">
        {/* Title and logo */}
        <Title />

        {/* Password Reset Forms - Each step has its own form */}
        {currentStep === 'email' && (
          <ResetPasswordForm 
            onSuccess={(email) => {
              setEmail(email);
              setCurrentStep('verification');
            }} 
          />
        )}
        
        {currentStep === 'verification' && (
          <VerificationForm 
            email={email}
            onSuccess={() => setCurrentStep('new-password')}
            onBack={() => setCurrentStep('email')}
          />
        )}
        
        {currentStep === 'new-password' && (
          <NewPasswordForm 
            email={email}
            onSuccess={() => setCurrentStep('success')}
            onBack={() => setCurrentStep('verification')}
          />
        )}
        
        {currentStep === 'success' && (
          <ResetSuccess onFinish={() => window.location.href = '/'} />
        )}
        
        {/* Additional info panel - visible only on desktop */}
        <div className="hidden md:flex flex-col gap-6 mt-6 bg-[#151515] rounded-lg p-6 border border-white/8">
          <h2 className="text-lg font-medium">Восстановление доступа</h2>
          <p className="text-white/70">
            Чтобы восстановить доступ к вашему аккаунту, мы отправим код подтверждения на вашу электронную почту. 
            После подтверждения вы сможете установить новый пароль.
          </p>
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full ${currentStep === 'email' ? 'bg-[#58E877]' : 'bg-white/30'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'verification' ? 'bg-[#58E877]' : 'bg-white/30'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStep === 'new-password' || currentStep === 'success' ? 'bg-[#58E877]' : 'bg-white/30'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
