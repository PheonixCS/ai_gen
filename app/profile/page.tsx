"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';
import payService, { Product } from '@/services/pay.service';
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
  const [user, setUser] = useState<{ email: string; userId?: number; subscribed?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [isActivelySubscribed, setIsActivelySubscribed] = useState(false);

  // Add ref for product section to enable scrolling
  const productSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Check subscription status
    const checkSubscriptionStatus = async () => {
      try {
        if (currentUser?.email) {
          // Get user data including subscribed status
          const userData = await fetch(`/api/user.php?email=${currentUser.email}`)
            .then(res => res.json())
            .catch(err => {
              console.error("Error fetching user data:", err);
              return null;
            });
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          console.log('Stored user:', storedUser); // Debug log
          console.log('User data:', userData);
          // Обновляем ТОЛЬКО поле subscribed
          const updatedUser = {
            ...storedUser,
            subscribed: !!userData.user.subscribed // правильный путь к данным
          };
          console.log('Updated user:', updatedUser); // Debug log
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setIsActivelySubscribed(updatedUser.subscribed);
          console.log('Stored user:', storedUser);
          console.log('User data:', userData);
          // Update user state with subscribed status - fix type error
          // if (userData) {
          //   setUser(prev => {
          //     if (!prev) return prev;
          //     return {
          //       ...prev,
          //       subscribed: !!userData.user.subscribed // Ensure boolean type
          //     };
          //   });
          //   setIsActivelySubscribed(!!userData.subscribed);
          //   // обновление данных в локальном хранилище
          //   // localStorage.setItem('user', JSON.stringify({ ...currentUser, subscribed: !!userData.subscribed }));
          // }
          

          // Check subscription with payment service
          const subscription = await payService.checkSubscription(currentUser.email);
          console.log('Subscription status:', subscription); // Debug log

          // Check if subscription has valid fields
          const hasValidFields = subscription &&
            subscription.expired_at &&
            subscription.id;

          setHasValidSubscription(!!hasValidFields);

          // Update current plan based on subscription validity
          if (hasValidFields) {
            setCurrentPlan('pro');
            console.log('PRO access detected'); // Debug log
          } else {
            setCurrentPlan('free');
            console.log('Free access detected'); // Debug log
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // Default to free plan on error
        setCurrentPlan('free');
        setHasValidSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscriptionStatus();

    // Fetch available products
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const availableProducts = await payService.getProducts();
        setProducts(availableProducts);

        // Set the first product as selected by default if available
        if (availableProducts.length > 0) {
          setSelectedOption(availableProducts[0].product_id);
        }

      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
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
    if (selectedOption) {
      router.push(`/payment?productId=${selectedOption}`);
    } else {
      alert('Пожалуйста, выберите план подписки');
    }
  };

  // Add function to handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!user?.email) return;

    // Ask for confirmation
    const confirmed = window.confirm("Вы уверены, что хотите отменить PRO подписку? Вы потеряете доступ ко всем премиум-функциям.");

    if (!confirmed) return;

    try {
      setCancellingSubscription(true);
      await payService.cancelSubscription(user.email);
      alert("Подписка успешно отменена");
      setIsActivelySubscribed(false);
      setUser(prev => prev ? { ...prev, subscribed: false } : prev);
      // Don't change currentPlan here as the user might still have valid subscription time
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Не удалось отменить подписку. Пожалуйста, попробуйте позже.");
    } finally {
      setCancellingSubscription(false);
    }
  };

  // Scroll to product section
  const scrollToProducts = () => {
    if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
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
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1252 20.9999C15.9332 20.9999 15.7412 20.9264 15.5949 20.7802L7.34494 12.5302C7.05169 12.2369 7.05169 11.7629 7.34494 11.4697L15.5949 3.21969C15.8882 2.92644 16.3622 2.92644 16.6554 3.21969C16.9487 3.51294 16.9487 3.98694 16.6554 4.28019L8.93569 11.9999L16.6554 19.7197C16.9487 20.0129 16.9487 20.4869 16.6554 20.7802C16.5092 20.9264 16.3172 20.9999 16.1252 20.9999Z" fill="#F0F6F3" />
            </svg>
          </button>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => router.push('/history')}
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.0003 2.89789V2.39252C12.0003 2.2291 11.8149 2.13466 11.6827 2.23071L9.21912 4.02058C9.10919 4.10044 9.10919 4.26432 9.21912 4.34419L11.6827 6.13402C11.8149 6.23007 12.0003 6.13563 12.0003 5.97221V5.46684C15.8502 5.46684 18.9824 8.59899 18.9824 12.4489C18.9824 16.2989 15.8502 19.4311 12.0003 19.4311C8.28456 19.4311 5.23747 16.5135 5.02949 12.849C5.01697 12.6284 4.83908 12.4489 4.61816 12.4489H2.84922C2.6283 12.4489 2.44836 12.6286 2.45746 12.8493C2.6673 17.9385 6.8595 22 12.0003 22C17.2752 22 21.5513 17.7239 21.5513 12.4489C21.5513 7.17406 17.2752 2.89789 12.0003 2.89789Z" fill="#F0F6F3" />
              <path d="M15.7485 12.449C15.7485 10.3821 14.067 8.70068 12.0002 8.70068C9.9334 8.70068 8.25195 10.3822 8.25195 12.449C8.25195 14.5158 9.93344 16.1972 12.0002 16.1972C14.067 16.1972 15.7485 14.5158 15.7485 12.449ZM11.4143 10.8954H12.5861V12.4906L13.4375 13.1726L12.705 14.0872L11.4143 13.0535V10.8954Z" fill="#F0F6F3" />
            </svg>
          </button>
        </div>
      </header>
      {/* Main content */}
      <main className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">Профиль</h1>

        {/* Data label above the section */}
        <div className="text-white/60 mb-2 text-sm font-light">Данные</div>

        {/* Profile Information */}
        <section className="bg-[#151515] rounded-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.49664 2 2 6.47427 2 12C2 17.5034 6.47427 22 12 22C17.5257 22 22 17.5034 22 12C22 6.49664 17.5034 2 12 2ZM12 7.12304C13.7002 7.12304 15.1096 8.51007 15.1096 10.2327C15.1096 11.9329 13.7226 13.3423 12 13.3423C10.2774 13.3423 8.89038 11.9329 8.89038 10.2103C8.89038 8.51007 10.2998 7.12304 12 7.12304ZM12 19.9418C10.0984 19.9418 8.35347 19.2707 6.98881 18.1521C8.42058 16.5861 10.1655 15.7136 12 15.7136C13.8345 15.7136 15.6018 16.5638 17.0112 18.1521C15.6465 19.2707 13.9016 19.9418 12 19.9418Z" fill="#F0F6F3" />
              </svg>
            </div>
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-xs text-white/50">Вход через email</p>
            </div>
          </div>

          <div className="h-px bg-white/10 my-4 sm:my-5"></div>

          <div className="flex justify-center gap-6">
            <button
              onClick={handleChangePassword}
              className="px-4 py-2 bg-[#252525] text-white/90 rounded-lg hover:bg-[#303030] transition-colors text-sm"
            >
              Изменить пароль
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-transparent border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
            >
              Выйти
            </button>
          </div>
        </section>
        {/* Access label above the section */}
        <div className="text-white/60 mb-2 text-sm font-light">Доступ</div>

        {/* Current Plan with gradient border */}
        <section className="rounded-xl p-0.5 mb-4 sm:mb-8 bg-gradient-to-r from-[#58E877]/30 to-[#FFFBA1]/30">
          <div className="bg-[#151515] rounded-[10px] p-4 sm:p-6 relative overflow-hidden">
            {/* Background gradient effect */}
            <div className={`absolute inset-0 opacity-10 ${
              currentPlan === 'pro'
                ? 'bg-gradient-to-br from-[#58E877]/20 to-[#FFFBA1]/20'
                : ''
            }`}></div>

            <div className="flex items-center justify-between gap-4 sm:gap-5 relative z-10">
              <div className="flex items-start gap-3 sm:gap-5">
                {/* Diamond icon */}
                <div className={`p-2 sm:p-3 rounded-lg ${
                  currentPlan === 'pro'
                    ? 'bg-gradient-to-br from-[#58E877]/20 to-[#FFFBA1]/20'
                    : 'bg-white/5'
                }`}>
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.7644 0.497559L11.4243 1.12291L12.0838 1.74823L14.7669 4.29125L15.8983 1.74823L16.1764 1.12291L16.4545 0.497559H10.7644ZM9.92647 1.42773L10.2658 1.74914L13.1632 4.49474H6.74939L9.59338 1.74914L9.92647 1.42773ZM17.082 2.16535L17.378 1.5L19.4895 4.49446H18.7241H17.9591H16.046L16.786 2.83071L17.082 2.16535ZM5.91187 5.74512L9.8652 14.6323L10.0165 14.9712L10.097 14.7903L14.1208 5.74512H5.91187ZM18.3108 5.74512H19.1554H20L11.1583 15.4819L11.9696 13.658L12.7804 11.8354L15.4893 5.74512H18.3108ZM2.90503 2.06305L3.20437 2.73551L3.98683 4.49474H2.00913H1.25292H0.496704L2.60613 1.39062L2.90503 2.06305ZM3.57812 0.497559L3.85617 1.12291L4.13422 1.74823L5.23356 4.2191L7.79283 1.74823L8.44068 1.12291L9.08811 0.497559H3.57812ZM7.21171 11.7445L8.00921 13.5363L8.80585 15.3277L0 5.74512H0.849613H1.6988H4.54322L7.21171 11.7445Z" fill={currentPlan === 'pro' ? "#FFFBA1" : "#F0F6F3"} />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center mb-2">
                    <h3 className={`text-lg sm:text-xl font-bold ${
                      currentPlan === 'pro'
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]'
                        : 'text-white'
                    }`}>
                      {currentPlan === 'free' ? 'Бесплатный план' : 'PRO план'}
                    </h3>

                    {currentPlan === 'pro' && (
                      <div className="ml-3 px-3 py-1 bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black text-xs font-bold rounded-full">
                        Активен
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-white/50">
                    {currentPlan === 'free'
                      ? '10 сохранений в день'
                      : 'Безлимитные сохранения'}
                  </p>
                </div>
              </div>

              {currentPlan === 'free' ? (
                <div className="flex-shrink-0">
                  <button
                    onClick={scrollToProducts}
                    className="px-4 py-1.5 sm:py-1 bg-transparent text-sm font-bold hover:opacity-80 transition-opacity"
                  >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]">
                      Сменить
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex-shrink-0">
                  {isActivelySubscribed && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancellingSubscription}
                      className="px-4 py-1.5 sm:py-1 text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingSubscription ? "Отмена..." : "Отменить подписку"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Plan comparison table - Now separated as its own section */}
        <section className="rounded-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 pr-4 w-[60%] sm:w-auto text-xs sm:text-sm text-white/70">Преимущества</th>
                  <th className="text-center py-3 px-4 text-xs sm:text-sm text-white/70 w-[20%]">Free</th>
                  <th className="text-center py-3 px-4 w-[20%] rounded-t-lg bg-[#1A1A1A]">
                    <span className="text-xs sm:text-sm bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1] font-bold">Pro</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Безлимитное сохранение */}
                <tr className="border-t border-white/5">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-shrink-0 w-6 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                          <path d="M16.4724 7.51023C15.8176 7.50591 15.1698 7.6446 14.5741 7.91661C13.9785 8.18863 13.4495 8.58741 13.024 9.0851L12.3563 9.85423L13.8466 11.5756L14.7256 10.5614C14.9414 10.3095 15.2094 10.1078 15.5111 9.97007C15.8127 9.83238 16.1408 9.76208 16.4724 9.76407C16.7698 9.75936 17.0653 9.81388 17.3415 9.92446C17.6177 10.035 17.8692 10.1995 18.0812 10.4082C18.2933 10.6169 18.4617 10.8657 18.5766 11.1401C18.6916 11.4146 18.7508 11.7091 18.7508 12.0067C18.7508 12.3042 18.6916 12.5987 18.5766 12.8732C18.4617 13.1476 18.2933 13.3964 18.0812 13.6051C17.8692 13.8138 17.6177 13.9783 17.3415 14.0888C17.0653 14.1994 16.7698 14.2539 16.4724 14.2492C16.1418 14.2514 15.8148 14.1815 15.5141 14.0442C15.2134 13.907 14.9462 13.7058 14.7313 13.4547C11.4671 9.68575 13.0181 11.4826 10.9448 9.08229C10.5187 8.58547 9.98951 8.18746 9.39398 7.91597C8.79845 7.64447 8.15091 7.50602 7.49642 7.51023C6.3039 7.51023 5.16021 7.98396 4.31697 8.8272C3.47373 9.67044 3 10.8141 3 12.0067C3 13.1992 3.47373 14.3429 4.31697 15.1861C5.16021 16.0293 6.3039 16.5031 7.49642 16.5031C8.1512 16.5074 8.79902 16.3687 9.39464 16.0967C9.99025 15.8247 10.5193 15.4259 10.9448 14.9282L11.6125 14.1591L10.1221 12.4377L9.24315 13.4519C9.02741 13.7038 8.75938 13.9055 8.45772 14.0432C8.15606 14.1809 7.82802 14.2512 7.49642 14.2492C7.19893 14.2539 6.90348 14.1994 6.62726 14.0888C6.35105 13.9783 6.0996 13.8138 5.88755 13.6051C5.67551 13.3964 5.50711 13.1476 5.39216 12.8732C5.27721 12.5987 5.21801 12.3042 5.21801 12.0067C5.21801 11.7091 5.27721 11.4146 5.39216 11.1401C5.50711 10.8657 5.67551 10.6169 5.88755 10.4082C6.0996 10.1995 6.35105 10.035 6.62726 9.92446C6.90348 9.81388 7.19893 9.75936 7.49642 9.76407C7.82695 9.76189 8.15398 9.83185 8.45469 9.96906C8.75541 10.1063 9.02256 10.3075 9.23752 10.5586C12.5016 14.3275 10.9507 12.5307 13.024 14.931C13.5125 15.513 14.1401 15.9623 14.8484 16.2374C15.5568 16.5124 16.323 16.6043 17.0763 16.5045C17.8296 16.4048 18.5456 16.1165 19.1579 15.6666C19.7702 15.2166 20.2591 14.6194 20.5793 13.9303C20.8996 13.2412 21.0408 12.4825 20.9898 11.7243C20.9389 10.9661 20.6976 10.2331 20.2881 9.59296C19.8786 8.95286 19.3143 8.42641 18.6473 8.06235C17.9803 7.69829 17.2322 7.50839 16.4724 7.51023Z" fill="url(#paint0_linear_28_2678)"/>
                          <defs>
                          <linearGradient id="paint0_linear_28_2678" x1="21" y1="12.0269" x2="3" y2="12.0269" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FFFBA1"/>
                          <stop offset="1" stopColor="#58E877"/>
                          </linearGradient>
                          </defs>
                        </svg>
                      </div>
                        <span className="text-xs sm:text-sm">Безлимитное сохранение</span>
                      
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-white/40 inline-block w-5 font-medium">—</span>
                  </td>
                  <td className="py-3 px-4 bg-[#1A1A1A]">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                      <path d="M9 0C4.05 0 0 4.05 0 9C0 13.95 4.05 18 9 18C13.95 18 18 13.95 18 9C18 4.05 13.95 0 9 0ZM7.2 13.5L2.7 9L3.969 7.731L7.2 10.953L14.031 4.122L15.3 5.4L7.2 13.5Z" fill="url(#paint0_linear_check)" />
                      <defs>
                        <linearGradient id="paint0_linear_check" x1="0" y1="9" x2="18" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#58E877" />
                          <stop offset="1" stopColor="#FFFBA1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </td>
                </tr>
                
                {/* Row 2: Эксклюзивные пресеты */}
                <tr className="border-t border-white/5">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-shrink-0 w-6 flex items-center justify-center">
                        <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                          <path d="M8.6 1.97487C8.95 1.19987 10.05 1.19987 10.425 1.97487L11.525 4.39986C11.675 4.72485 11.975 4.92486 12.325 4.97487L14.975 5.27486C15.825 5.37487 16.175 6.42485 15.525 6.99986L13.575 8.79987C13.325 9.02485 13.2 9.39988 13.275 9.72487L13.8 12.3249C13.9751 13.1749 13.0751 13.7999 12.325 13.3999L10 12.0999C9.70002 11.9248 9.32503 11.9248 9.025 12.0999L6.69999 13.3999C5.94999 13.8249 5.04999 13.1749 5.22497 12.3249L5.74998 9.72487C5.82498 9.37488 5.69997 9.02489 5.44999 8.79987L3.5 6.99986C2.87499 6.42485 3.22501 5.37487 4.05001 5.27486L6.70002 4.97487C7.05001 4.92486 7.35 4.72488 7.50002 4.39986L8.6 1.97487ZM16 -0.00012207C16.825 -0.00012207 17.5 0.674864 17.5 1.49986C17.5 2.32486 16.825 2.99985 16 2.99985C15.175 2.99985 14.5 2.32486 14.5 1.49986C14.5 0.674864 15.175 -0.00012207 16 -0.00012207ZM1.99998 8.49988C2.82498 8.49988 3.49997 9.17486 3.49997 9.99986C3.49997 10.8249 2.82498 11.4998 1.99998 11.4998C1.17499 11.4998 0.5 10.8249 0.5 9.99986C0.5 9.17486 1.17499 8.49988 1.99998 8.49988ZM9.50001 13.9999C10.05 13.9999 10.5 14.4499 10.5 14.9999C10.5 15.5499 10.05 15.9999 9.50001 15.9999C8.95 15.9999 8.49999 15.5499 8.49999 14.9999C8.49999 14.4499 8.95 13.9999 9.50001 13.9999Z" fill="url(#paint0_linear_1490_3240)"/>
                          <defs>
                          <linearGradient id="paint0_linear_1490_3240" x1="17.5" y1="7.99989" x2="0.5" y2="7.99989" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FFFBA1"/>
                          <stop offset="1" stopColor="#58E877"/>
                          </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm">Эксклюзивные пресеты</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-white/40 inline-block w-5 font-medium">—</span>
                  </td>
                  <td className="py-3 px-4 bg-[#1A1A1A]">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                      <path d="M9 0C4.05 0 0 4.05 0 9C0 13.95 4.05 18 9 18C13.95 18 18 13.95 18 9C18 4.05 13.95 0 9 0ZM7.2 13.5L2.7 9L3.969 7.731L7.2 10.953L14.031 4.122L15.3 5.4L7.2 13.5Z" fill="url(#paint0_linear_check)" />
                      <defs>
                        <linearGradient id="paint0_linear_check" x1="0" y1="9" x2="18" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#58E877" />
                          <stop offset="1" stopColor="#FFFBA1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </td>
                </tr>
                
                {/* Row 3: Доступны все инструменты */}
                <tr className="border-t border-white/5">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-shrink-0 w-6 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                          <path d="M17.9542 9.30454C17.8804 9.13232 17.711 9.02069 17.5236 9.02069H14.2653L16.4366 4.67838C16.5092 4.53313 16.5015 4.3605 16.4161 4.22232C16.3307 4.08409 16.1797 4 16.0172 4L9.49006 4.00038C9.29841 4.00038 9.12606 4.11706 9.05487 4.29504L6.04233 11.8258C5.98455 11.9702 6.00217 12.1339 6.08939 12.2627C6.17658 12.3915 6.32199 12.4686 6.47756 12.4686H10.304L7.54863 19.3571C7.46513 19.5659 7.54154 19.8045 7.73085 19.9258C7.80857 19.9757 7.89642 20 7.98367 20C8.10867 20 8.23252 19.9501 8.32371 19.8541L17.8634 9.81227C17.9924 9.67642 18.0282 9.47673 17.9542 9.30454Z" fill="url(#paint0_linear_29_2751)"/>
                          <defs>
                          <linearGradient id="paint0_linear_29_2751" x1="17.9923" y1="12" x2="6.00879" y2="12" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FFFBA1"/>
                          <stop offset="1" stopColor="#58E877"/>
                          </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm">Доступны все инструменты</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-white/40 inline-block w-5 font-medium">—</span>
                  </td>
                  <td className="py-3 px-4 bg-[#1A1A1A]">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                      <path d="M9 0C4.05 0 0 4.05 0 9C0 13.95 4.05 18 9 18C13.95 18 18 13.95 18 9C18 4.05 13.95 0 9 0ZM7.2 13.5L2.7 9L3.969 7.731L7.2 10.953L14.031 4.122L15.3 5.4L7.2 13.5Z" fill="url(#paint0_linear_check)" />
                      <defs>
                        <linearGradient id="paint0_linear_check" x1="0" y1="9" x2="18" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#58E877" />
                          <stop offset="1" stopColor="#FFFBA1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </td>
                </tr>
                
                {/* Row 4: Экспорт в HD качестве */}
                <tr className="border-t border-white/5">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-shrink-0 w-6 flex items-center justify-center">
                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                          <path fillRule="evenodd" clipRule="evenodd" d="M4.6875 5.59078C4.70476 5.59078 4.71875 5.57679 4.71875 5.55953V1.39613C4.71875 1.10157 4.95753 0.862793 5.25208 0.862793H6.99792C7.29247 0.862793 7.53125 1.10157 7.53125 1.39613V12.6034C7.53125 12.898 7.29247 13.1368 6.99792 13.1368H5.25208C4.95753 13.1368 4.71875 12.898 4.71875 12.6034V8.44003C4.71875 8.42277 4.70476 8.40878 4.6875 8.40878H2.84375C2.82649 8.40878 2.8125 8.42277 2.8125 8.44003V12.6034C2.8125 12.898 2.57372 13.1368 2.27917 13.1368H0.533333C0.238782 13.1368 0 12.898 0 12.6034V1.39613C0 1.10157 0.238781 0.862793 0.533333 0.862793H2.27917C2.57372 0.862793 2.8125 1.10157 2.8125 1.39613V5.55953C2.8125 5.57679 2.82649 5.59078 2.84375 5.59078H4.6875ZM9.00208 0.863037H12.25C14.3177 0.863037 16 2.54858 16 4.62038V9.37967C16 11.4515 14.3177 13.137 12.25 13.137H9.00208C8.70753 13.137 8.46875 12.8982 8.46875 12.6037V1.39637C8.46875 1.10182 8.70753 0.863037 9.00208 0.863037ZM12.25 3.68104H11.2812V10.319H12.25C12.767 10.319 13.1875 9.89765 13.1875 9.37967V4.62038C13.1875 4.1024 12.767 3.68104 12.25 3.68104Z" fill="url(#paint0_linear_1490_500)"/>
                          <defs>
                          <linearGradient id="paint0_linear_1490_500" x1="16" y1="6.9999" x2="0" y2="6.9999" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FFFBA1"/>
                          <stop offset="1" stopColor="#58E877"/>
                          </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm">Экспорт в HD качестве</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-white/40 inline-block w-5 font-medium">—</span>
                  </td>
                  <td className="py-3 px-4 bg-[#1A1A1A] rounded-b-lg">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                      <path d="M9 0C4.05 0 0 4.05 0 9C0 13.95 4.05 18 9 18C13.95 18 18 13.95 18 9C18 4.05 13.95 0 9 0ZM7.2 13.5L2.7 9L3.969 7.731L7.2 10.953L14.031 4.122L15.3 5.4L7.2 13.5Z" fill="url(#paint0_linear_check)" />
                      <defs>
                        <linearGradient id="paint0_linear_check" x1="0" y1="9" x2="18" y2="9" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#58E877" />
                          <stop offset="1" stopColor="#FFFBA1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Purchase options - add ref here */}
        {(currentPlan === 'free' || (currentPlan ==='pro' && !isActivelySubscribed)) && (
          <section ref={productSectionRef} className="bg-[#151515] rounded-xl p-4 sm:p-6 mb-4 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Получить PRO доступ</h2>
            {loadingProducts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-4 text-white/60">
                Не удалось загрузить доступные тарифы. Пожалуйста, попробуйте позже.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                      selectedOption === product.product_id
                        ? 'border-[#58E877] bg-[#58E877]/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedOption(product.product_id)}
                  >
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                      <h3 className="font-medium text-sm sm:text-base">
                        PRO на {product.period} {product.interval === 'day' ? 'дней' : product.interval === 'week' ? 'недель' : 'месяцев'}
                      </h3>
                      <div className="flex items-center">
                        {product.has_trial && (
                          <span className="text-white/50 text-xs sm:text-sm line-through mr-2">
                            {product.amount}₽
                          </span>
                        )}
                        <span className={`text-base sm:text-lg font-bold ${product.has_trial ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]' : ''}`}>
                          {product.has_trial ? '1₽' : `${product.amount}₽`}
                        </span>
                      </div>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm">
                      {product.description || (product.has_trial ? 'Пробный период с полным доступом ко всем функциям' : 'Полный доступ ко всем PRO возможностям')}
                    </p>
                    <div className="mt-1 sm:mt-2 text-xs text-white/50">Единоразовый платеж</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleActivatePro}
              disabled={loadingProducts || products.length === 0 || !selectedOption}
              className="w-full py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium text-center text-sm sm:text-base transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Активировать PRO доступ
            </button>
          </section>
        )}
        {/* Legal documents label */}
        <div className="text-white/60 mb-2 text-sm font-light">Правовые документы</div>
        {/* Legal documents */}
        <section className="bg-[#151515] rounded-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex flex-col gap-3">
            <Link href="/legal/privacy" className="text-white/70 hover:text-white flex items-center gap-2 text-sm sm:text-base">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Политика конфиденциальности
            </Link>
            <Link href="/legal/contact" className="text-white/70 hover:text-white flex items-center gap-2 text-sm sm:text-base">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Контакты
            </Link>
            <Link href="/legal/offer" className="text-white/70 hover:text-white flex items-center gap-2 text-sm sm:text-base">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Договор оферты
            </Link>
          </div>
        </section>
        {/* Support section label */}
        <div className="text-white/60 mb-2 text-sm font-light">Поддержка</div>
        {/* Support section */}
        <section className="bg-[#151515] rounded-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <p className="text-white/70 mb-4 whitespace-pre-line text-sm sm:text-base">
            У вас возникли проблемы?
            Наша служба поддержки готова помочь вам.
            Нажмите на кнопку ниже чтобы связаться с нами
          </p>
          <Link
            href="/support"
            className="inline-block px-4 sm:px-5 py-2 sm:py-2.5 bg-[#252525] rounded-lg text-white/90 text-sm sm:text-base hover:bg-[#303030] transition-colors"
          >
            Email поддержка
          </Link>
        </section>
        {/* Delete account */}
        <section className="bg-[#151515] rounded-xl p-4 sm:p-6 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-red-500 mb-2 sm:mb-3">Опасная зона</h2>
          <p className="text-white/70 mb-4 text-sm sm:text-base">
            Удаление аккаунта приведет к безвозвратной потере всех ваших данных и истории генераций. Это действие нельзя отменить.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-red-900/30 border border-red-900/50 rounded-lg text-red-200 text-sm sm:text-base hover:bg-red-900/50 transition-colors"
          >
            Удалить аккаунт
          </button>
        </section>
      </main>
    </div>
  );
}
