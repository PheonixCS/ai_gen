"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';
import Link from 'next/link';
import Image from 'next/image';

type PlanType = 'free' | 'pro';
type PurchaseOption = '3days' | '7days';

const planFeatures = [
  { name: 'Создание изображений', free: '50 в день', pro: 'Безлимитно' },
  { name: 'Улучшение качества', free: '25 в день', pro: 'Безлимитно' },
  { name: 'Создание фонов', free: '10 в день', pro: 'Безлимитно' },
  { name: 'Удаление объектов', free: '5 в день', pro: 'Безлимитно' },
  { name: 'Изменение лица', free: 'Ограничено', pro: 'Полный доступ' },
  { name: 'Стилизация', free: 'Базовые стили', pro: 'Все стили' },
  { name: 'Сохранение истории', free: '7 дней', pro: '30 дней' },
  { name: 'Размер изображений', free: 'до 1024x1024', pro: 'до 2048x2048' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; userId?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [selectedOption, setSelectedOption] = useState<PurchaseOption>('3days');

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  const handleChangePassword = () => {
    router.push('/reset-password');
  };

  const handleDeleteAccount = () => {
    // This is a placeholder for account deletion functionality
    if (confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить.')) {
      alert('Эта функция в настоящее время недоступна. Пожалуйста, свяжитесь с службой поддержки для удаления аккаунта.');
    }
  };

  const handleActivatePro = () => {
    alert(`Активация PRO плана на ${selectedOption === '3days' ? '3 дня' : '7 дней'}`);
    // Здесь будет переход на страницу оплаты
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <Link href="/home" className="text-xl font-bold">AI Photo Gen</Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-8">Профиль пользователя</h1>

        {/* Profile Information */}
        <section className="bg-[#151515] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Информация об аккаунте</h2>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-white/70 mb-1">Email:</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleChangePassword}
                className="px-4 py-2 bg-[#252525] text-white/90 rounded-lg hover:bg-[#303030] transition-colors"
              >
                Изменить пароль
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-[#252525] text-white/90 rounded-lg hover:bg-[#303030] transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </section>

        {/* Current Plan */}
        <section className="bg-[#151515] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Ваш текущий план</h2>
          
          <div className="border border-white/10 rounded-xl p-6 relative overflow-hidden">
            {/* Background gradient effect */}
            <div className={`absolute inset-0 opacity-10 ${
              currentPlan === 'pro' 
                ? 'bg-gradient-to-br from-[#58E877]/20 to-[#FFFBA1]/20' 
                : ''
            }`}></div>
            
            <div className="flex items-start gap-5 relative z-10">
              {/* Diamond icon */}
              <div className={`p-3 rounded-lg ${
                currentPlan === 'pro'
                  ? 'bg-gradient-to-br from-[#58E877]/20 to-[#FFFBA1]/20'
                  : 'bg-white/5'
              }`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M2.5 8H21.5M5.2 3H18.8C19.9201 3 20.4802 3 20.908 3.21799C21.2843 3.40973 21.5903 3.71569 21.782 4.09202C22 4.51984 22 5.07989 22 6.2V8.8C22 9.9201 22 10.4802 21.782 10.908C21.5903 11.2843 21.2843 11.5903 20.908 11.782C20.4802 12 19.9201 12 18.8 12H5.2C4.0799 12 3.51984 12 3.09202 11.782C2.71569 11.5903 2.40973 11.2843 2.21799 10.908C2 10.4802 2 9.9201 2 8.8V6.2C2 5.07989 2 4.51984 2.21799 4.09202C2.40973 3.71569 2.71569 3.40973 3.09202 3.21799C3.51984 3 4.0799 3 5.2 3Z" 
                    stroke={currentPlan === 'pro' ? "#FFFBA1" : "#FFFFFF"} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M22 7L12 17L2 7" 
                    stroke={currentPlan === 'pro' ? "#58E877" : "#FFFFFF"} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className={`text-xl font-bold ${
                      currentPlan === 'pro' 
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]' 
                        : 'text-white'
                    }`}>
                      {currentPlan === 'free' ? 'Бесплатный план' : 'PRO план'}
                    </h3>
                    <p className="text-sm text-white/50 mt-1">
                      {currentPlan === 'free' 
                        ? '10 сохранений в день' 
                        : 'Безлимитные сохранения'}
                    </p>
                  </div>
                  
                  {currentPlan === 'pro' && (
                    <div className="px-3 py-1 bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black text-xs font-bold rounded-full">
                      Активен
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <button 
                    onClick={() => currentPlan === 'free' 
                      ? router.push('/pricing') 
                      : alert('Вы уже используете PRO план')
                    }
                    className="text-sm font-medium hover:underline text-white/70 hover:text-white/90 transition-colors"
                  >
                    {currentPlan === 'free' ? 'Обновить до PRO' : 'Управление подпиской'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Plan comparison table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 pr-4 text-white/70">Функция</th>
                  <th className="text-left py-3 px-4 text-white/70">Бесплатный план</th>
                  <th className="text-left py-3 pl-4 text-white/70">PRO план</th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((feature, index) => (
                  <tr key={index} className="border-t border-white/5">
                    <td className="py-3 pr-4">{feature.name}</td>
                    <td className="py-3 px-4 text-white/70">{feature.free}</td>
                    <td className="py-3 pl-4 font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]">
                      {feature.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Purchase options */}
        {currentPlan === 'free' && (
          <section className="bg-[#151515] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Получить PRO доступ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 3 days option */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedOption === '3days' 
                    ? 'border-[#58E877] bg-[#58E877]/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedOption('3days')}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">PRO на 3 дня</h3>
                  <div className="flex items-center">
                    <span className="text-white/50 line-through mr-2">390₽</span>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]">1₽</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm">Пробный период с полным доступом ко всем функциям</p>
                <div className="mt-2 text-xs text-white/50">Единоразовый платеж</div>
              </div>
              
              {/* 7 days option */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedOption === '7days' 
                    ? 'border-[#58E877] bg-[#58E877]/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedOption('7days')}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">PRO на 7 дней</h3>
                  <div className="flex items-center">
                    <span className="text-white/50 line-through mr-2">1690₽</span>
                    <span className="text-lg font-bold">890₽</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm">Неделя без ограничений со всеми PRO возможностями</p>
                <div className="mt-2 text-xs text-white/50">Единоразовый платеж</div>
              </div>
            </div>
            
            <button 
              onClick={handleActivatePro}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium text-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Активировать PRO доступ
            </button>
          </section>
        )}

        {/* Legal documents */}
        <section className="bg-[#151515] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Правовые документы</h2>
          <div className="flex flex-col gap-3">
            <Link href="/legal/privacy" className="text-white/70 hover:text-white flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Политика конфиденциальности
            </Link>
            <Link href="/legal/terms" className="text-white/70 hover:text-white flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Условия использования
            </Link>
            <Link href="/legal/offer" className="text-white/70 hover:text-white flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Договор оферты
            </Link>
          </div>
        </section>

        {/* Support section */}
        <section className="bg-[#151515] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">Поддержка</h2>
          <p className="text-white/70 mb-4 whitespace-pre-line">
            У вас возникли проблемы?
            Наша служба поддержки готова помочь вам.
            Нажмите на кнопку ниже чтобы связаться с нами
          </p>
          <Link 
            href="/support"
            className="inline-block px-5 py-2.5 bg-[#252525] rounded-lg text-white/90 hover:bg-[#303030] transition-colors"
          >
            Email поддержка
          </Link>
        </section>

        {/* Delete account */}
        <section className="bg-[#151515] rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-red-500 mb-3">Опасная зона</h2>
          <p className="text-white/70 mb-4">
            Удаление аккаунта приведет к безвозвратной потере всех ваших данных и истории генераций. Это действие нельзя отменить.
          </p>
          <button 
            onClick={handleDeleteAccount}
            className="px-5 py-2.5 bg-red-900/30 border border-red-900/50 rounded-lg text-red-200 hover:bg-red-900/50 transition-colors"
          >
            Удалить аккаунт
          </button>
        </section>
      </main>
    </div>
  );
}
