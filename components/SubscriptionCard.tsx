"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const FeatureCard = ({ icon, title, subtitle }: FeatureCardProps) => (
  <div className="flex-shrink-0 w-[260px] bg-[#151515] rounded-lg p-4 border border-white/5">
    <div className="flex items-start gap-3 mb-2">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h4 className="font-medium text-sm mb-1">{title}</h4>
        <p className="text-white/60 text-xs">{subtitle}</p>
      </div>
    </div>
  </div>
);

interface SubscriptionCardProps {
  onClose: () => void;
}

export default function SubscriptionCard({ onClose }: SubscriptionCardProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptSubscription, setAcceptSubscription] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll the carousel
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    const animateScroll = () => {
      const scrollWidth = carousel.scrollWidth;
      const clientWidth = carousel.clientWidth;
      
      if (scrollWidth <= clientWidth) return;

      let currentScrollPosition = 0;
      const scrollAmount = 1; // Pixels to scroll per frame
      
      const scroll = () => {
        currentScrollPosition += scrollAmount;
        
        // Reset when we reach the end of the first set of cards
        if (currentScrollPosition >= 280) { // Width of a card + gap
          // Move first card to the end
          if (carousel.firstElementChild) {
            const firstCard = carousel.firstElementChild;
            carousel.appendChild(firstCard.cloneNode(true));
            carousel.removeChild(firstCard);
          }
          currentScrollPosition = 0;
          carousel.scrollLeft = 0;
        } else {
          carousel.scrollLeft = currentScrollPosition;
        }
        
        requestId = requestAnimationFrame(scroll);
      };
      
      let requestId = requestAnimationFrame(scroll);
      
      return () => {
        cancelAnimationFrame(requestId);
      };
    };
    
    const cleanup = animateScroll();
    return cleanup;
  }, []);
  
  return (
    <div className="bg-[#121212] rounded-xl p-5 max-w-md w-full mx-auto">
      {/* Header with close button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-white">Оплатите доступ к сервису</h2>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Feature cards carousel with fade effect on edges */}
      <div className="relative mb-6">
        {/* Left fade overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#121212] to-transparent z-10"></div>
        
        {/* Right fade overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#121212] to-transparent z-10"></div>
        
        {/* Scrollable carousel */}
        <div 
          ref={carouselRef}
          className="flex gap-4 overflow-x-hidden py-2 px-2 scroll-smooth"
        >
          {/* Feature Cards */}
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.9533 9.30454C17.8794 9.13232 17.71 9.02069 17.5226 9.02069H14.2644L16.4356 4.67838C16.5082 4.53313 16.5005 4.3605 16.4151 4.22232C16.3297 4.08409 16.1787 4 16.0163 4L9.48909 4.00038C9.29743 4.00038 9.12508 4.11706 9.0539 4.29504L6.04135 11.8258C5.98357 11.9702 6.0012 12.1339 6.08842 12.2627C6.17561 12.3915 6.32101 12.4686 6.47658 12.4686H10.3031L7.54766 19.3571C7.46415 19.5659 7.54056 19.8045 7.72988 19.9258C7.8076 19.9757 7.89544 20 7.98269 20C8.10769 20 8.23154 19.9501 8.32273 19.8541L17.8625 9.81227C17.9915 9.67642 18.0272 9.47673 17.9533 9.30454Z" fill="url(#paint0_linear_1526_6431)"/>
                <defs>
                <linearGradient id="paint0_linear_1526_6431" x1="17.9913" y1="12" x2="6.00781" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFBA1"/>
                <stop offset="1" stopColor="#58E877"/>
                </linearGradient>
                </defs>
              </svg>
            }
            title="Доступны все инструменты"
            subtitle="Редактируй фото как профи"
          />
          
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.4724 7.51023C15.8176 7.50591 15.1698 7.6446 14.5741 7.91661C13.9785 8.18863 13.4495 8.58741 13.024 9.0851L12.3563 9.85423L13.8466 11.5756L14.7256 10.5614C14.9414 10.3095 15.2094 10.1078 15.5111 9.97007C15.8127 9.83238 16.1408 9.76208 16.4724 9.76407C16.7698 9.75936 17.0653 9.81388 17.3415 9.92446C17.6177 10.035 17.8692 10.1995 18.0812 10.4082C18.2933 10.6169 18.4617 10.8657 18.5766 11.1401C18.6916 11.4146 18.7508 11.7091 18.7508 12.0067C18.7508 12.3042 18.6916 12.5987 18.5766 12.8732C18.4617 13.1476 18.2933 13.3964 18.0812 13.6051C17.8692 13.8138 17.6177 13.9783 17.3415 14.0888C17.0653 14.1994 16.7698 14.2539 16.4724 14.2492C16.1418 14.2514 15.8148 14.1815 15.5141 14.0442C15.2134 13.907 14.9462 13.7058 14.7313 13.4547C11.4671 9.68575 13.0181 11.4826 10.9448 9.08229C10.5187 8.58547 9.98951 8.18746 9.39398 7.91597C8.79845 7.64447 8.15091 7.50602 7.49642 7.51023C6.3039 7.51023 5.16021 7.98396 4.31697 8.8272C3.47373 9.67044 3 10.8141 3 12.0067C3 13.1992 3.47373 14.3429 4.31697 15.1861C5.16021 16.0293 6.3039 16.5031 7.49642 16.5031C8.1512 16.5074 8.79902 16.3687 9.39464 16.0967C9.99025 15.8247 10.5193 15.4259 10.9448 14.9282L11.6125 14.1591L10.1221 12.4377L9.24315 13.4519C9.02741 13.7038 8.75938 13.9055 8.45772 14.0432C8.15606 14.1809 7.82802 14.2512 7.49642 14.2492C7.19893 14.2539 6.90348 14.1994 6.62726 14.0888C6.35105 13.9783 6.0996 13.8138 5.88755 13.6051C5.67551 13.3964 5.50711 13.1476 5.39216 12.8732C5.27721 12.5987 5.21801 12.3042 5.21801 12.0067C5.21801 11.7091 5.27721 11.4146 5.39216 11.1401C5.50711 10.8657 5.67551 10.6169 5.88755 10.4082C6.0996 10.1995 6.35105 10.035 6.62726 9.92446C6.90348 9.81388 7.19893 9.75936 7.49642 9.76407C7.82695 9.76189 8.15398 9.83185 8.45469 9.96906C8.75541 10.1063 9.02256 10.3075 9.23752 10.5586C12.5016 14.3275 10.9507 12.5307 13.024 14.931C13.5125 15.513 14.1401 15.9623 14.8484 16.2374C15.5568 16.5124 16.323 16.6043 17.0763 16.5045C17.8296 16.4048 18.5456 16.1165 19.1579 15.6666C19.7702 15.2166 20.2591 14.6194 20.5793 13.9303C20.8996 13.2412 21.0408 12.4825 20.9898 11.7243C20.9389 10.9661 20.6976 10.2331 20.2881 9.59296C19.8786 8.95286 19.3143 8.42641 18.6473 8.06235C17.9803 7.69829 17.2322 7.50839 16.4724 7.51023Z" fill="url(#paint0_linear_1526_7486)"/>
                <defs>
                <linearGradient id="paint0_linear_1526_7486" x1="21" y1="12.0269" x2="3" y2="12.0269" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFBA1"/>
                <stop offset="1" stopColor="#58E877"/>
                </linearGradient>
                </defs>
              </svg>
            }
            title="Безлимитные сохранения"
            subtitle="Сохраняйте сколько угодно"
          />
          
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.6 5.97487C11.95 5.19987 13.05 5.19987 13.425 5.97487L14.525 8.39986C14.675 8.72485 14.975 8.92486 15.325 8.97487L17.975 9.27486C18.825 9.37487 19.175 10.4248 18.525 10.9999L16.575 12.7999C16.325 13.0249 16.2 13.3999 16.275 13.7249L16.8 16.3249C16.9751 17.1749 16.0751 17.7999 15.325 17.3999L13 16.0999C12.7 15.9248 12.325 15.9248 12.025 16.0999L9.69999 17.3999C8.94999 17.8249 8.04999 17.1749 8.22497 16.3249L8.74998 13.7249C8.82498 13.3749 8.69997 13.0249 8.44999 12.7999L6.5 10.9999C5.87499 10.4248 6.22501 9.37487 7.05001 9.27486L9.70002 8.97487C10.05 8.92486 10.35 8.72488 10.5 8.39986L11.6 5.97487ZM19 3.99988C19.825 3.99988 20.5 4.67486 20.5 5.49986C20.5 6.32486 19.825 6.99985 19 6.99985C18.175 6.99985 17.5 6.32486 17.5 5.49986C17.5 4.67486 18.175 3.99988 19 3.99988ZM4.99998 12.4999C5.82498 12.4999 6.49997 13.1749 6.49997 13.9999C6.49997 14.8249 5.82498 15.4998 4.99998 15.4998C4.17499 15.4998 3.5 14.8249 3.5 13.9999C3.5 13.1749 4.17499 12.4999 4.99998 12.4999ZM12.5 17.9999C13.05 17.9999 13.5 18.4499 13.5 18.9999C13.5 19.5499 13.05 19.9999 12.5 19.9999C11.95 19.9999 11.5 19.5499 11.5 18.9999C11.5 18.4499 11.95 17.9999 12.5 17.9999Z" fill="url(#paint0_linear_1526_5287)"/>
                <defs>
                <linearGradient id="paint0_linear_1526_5287" x1="20.5" y1="11.9999" x2="3.5" y2="11.9999" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFBA1"/>
                <stop offset="1" stopColor="#58E877"/>
                </linearGradient>
                </defs>
              </svg>
            }
            title="Эксклюзивные пресеты"
            subtitle="Преобразуйте свои фотографии"
          />
          
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M8.6875 10.5908C8.70476 10.5908 8.71875 10.5768 8.71875 10.5595V6.39613C8.71875 6.10157 8.95753 5.86279 9.25208 5.86279H10.9979C11.2925 5.86279 11.5312 6.10157 11.5312 6.39613V17.6034C11.5312 17.898 11.2925 18.1368 10.9979 18.1368H9.25208C8.95753 18.1368 8.71875 17.898 8.71875 17.6034V13.44C8.71875 13.4228 8.70476 13.4088 8.6875 13.4088H6.84375C6.82649 13.4088 6.8125 13.4228 6.8125 13.44V17.6034C6.8125 17.898 6.57372 18.1368 6.27917 18.1368H4.53333C4.23878 18.1368 4 17.898 4 17.6034V6.39613C4 6.10157 4.23878 5.86279 4.53333 5.86279H6.27917C6.57372 5.86279 6.8125 6.10157 6.8125 6.39613V10.5595C6.8125 10.5768 6.82649 10.5908 6.84375 10.5908H8.6875ZM13.0021 5.86304H16.25C18.3177 5.86304 20 7.54858 20 9.62038V14.3797C20 16.4515 18.3177 18.137 16.25 18.137H13.0021C12.7075 18.137 12.4688 17.8982 12.4688 17.6037V6.39637C12.4688 6.10182 12.7075 5.86304 13.0021 5.86304ZM16.25 8.68104H15.2812V15.319H16.25C16.767 15.319 17.1875 14.8977 17.1875 14.3797V9.62038C17.1875 9.1024 16.767 8.68104 16.25 8.68104Z" fill="url(#paint0_linear_1526_5576)"/>
                <defs>
                <linearGradient id="paint0_linear_1526_5576" x1="20" y1="11.9999" x2="4" y2="11.9999" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFBA1"/>
                <stop offset="1" stopColor="#58E877"/>
                </linearGradient>
                </defs>
              </svg>
            }
            title="Экспорт в HD-качестве"
            subtitle="Получайте лучшее качество"
          />
          
          {/* Duplicate cards for continuous scrolling effect */}
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.9533 9.30454C17.8794 9.13232 17.71 9.02069 17.5226 9.02069H14.2644L16.4356 4.67838C16.5082 4.53313 16.5005 4.3605 16.4151 4.22232C16.3297 4.08409 16.1787 4 16.0163 4L9.48909 4.00038C9.29743 4.00038 9.12508 4.11706 9.0539 4.29504L6.04135 11.8258C5.98357 11.9702 6.0012 12.1339 6.08842 12.2627C6.17561 12.3915 6.32101 12.4686 6.47658 12.4686H10.3031L7.54766 19.3571C7.46415 19.5659 7.54056 19.8045 7.72988 19.9258C7.8076 19.9757 7.89544 20 7.98269 20C8.10769 20 8.23154 19.9501 8.32273 19.8541L17.8625 9.81227C17.9915 9.67642 18.0272 9.47673 17.9533 9.30454Z" fill="url(#paint1_linear_1526_6431)"/>
                <defs>
                <linearGradient id="paint1_linear_1526_6431" x1="17.9913" y1="12" x2="6.00781" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFBA1"/>
                <stop offset="1" stopColor="#58E877"/>
                </linearGradient>
                </defs>
              </svg>
            }
            title="Доступны все инструменты"
            subtitle="Редактируй фото как профи"
          />
          
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.4724 7.51023C15.8176 7.50591 15.1698 7.6446 14.5741 7.91661C13.9785 8.18863 13.4495 8.58741 13.024 9.0851L12.3563 9.85423L13.8466 11.5756L14.7256 10.5614C14.9414 10.3095 15.2094 10.1078 15.5111 9.97007C15.8127 9.83238 16.1408 9.76208 16.4724 9.76407C16.7698 9.75936 17.0653 9.81388 17.3415 9.92446C17.6177 10.035 17.8692 10.1995 18.0812 10.4082C18.2933 10.6169 18.4617 10.8657 18.5766 11.1401C18.6916 11.4146 18.7508 11.7091 18.7508 12.0067C18.7508 12.3042 18.6916 12.5987 18.5766 12.8732C18.4617 13.1476 18.2933 13.3964 18.0812 13.6051C17.8692 13.8138 17.6177 13.9783 17.3415 14.0888C17.0653 14.1994 16.7698 14.2539 16.4724 14.2492C16.1418 14.2514 15.8148 14.1815 15.5141 14.0442C15.2134 13.907 14.9462 13.7058 14.7313 13.4547C11.4671 9.68575 13.0181 11.4826 10.9448 9.08229C10.5187 8.58547 9.98951 8.18746 9.39398 7.91597C8.79845 7.64447 8.15091 7.50602 7.49642 7.51023C6.3039 7.51023 5.16021 7.98396 4.31697 8.8272C3.47373 9.67044 3 10.8141 3 12.0067C3 13.1992 3.47373 14.3429 4.31697 15.1861C5.16021 16.0293 6.3039 16.5031 7.49642 16.5031C8.1512 16.5074 8.79902 16.3687 9.39464 16.0967C9.99025 15.8247 10.5193 15.4259 10.9448 14.9282L11.6125 14.1591L10.1221 12.4377L9.24315 13.4519C9.02741 13.7038 8.75938 13.9055 8.45772 14.0432C8.15606 14.1809 7.82802 14.2512 7.49642 14.2492C7.19893 14.2539 6.90348 14.1994 6.62726 14.0888C6.35105 13.9783 6.0996 13.8138 5.88755 13.6051C5.67551 13.3964 5.50711 13.1476 5.39216 12.8732C5.27721 12.5987 5.21801 12.3042 5.21801 12.0067C5.21801 11.7091 5.27721 11.4146 5.39216 11.1401C5.50711 10.8657 5.67551 10.6169 5.88755 10.4082C6.0996 10.1995 6.35105 10.035 6.62726 9.92446C6.90348 9.81388 7.19893 9.75936 7.49642 9.76407C7.82695 9.76189 8.15398 9.83185 8.45469 9.96906C8.75541 10.1063 9.02256 10.3075 9.23752 10.5586C12.5016 14.3275 10.9507 12.5307 13.024 14.931C13.5125 15.513 14.1401 15.9623 14.8484 16.2374C15.5568 16.5124 16.323 16.6043 17.0763 16.5045C17.8296 16.4048 18.5456 16.1165 19.1579 15.6666C19.7702 15.2166 20.2591 14.6194 20.5793 13.9303C20.8996 13.2412 21.0408 12.4825 20.9898 11.7243C20.9389 10.9661 20.6976 10.2331 20.2881 9.59296C19.8786 8.95286 19.3143 8.42641 18.6473 8.06235C17.9803 7.69829 17.2322 7.50839 16.4724 7.51023Z" fill="url(#paint1_linear_1526_7486)"/>
                <defs>
                <linearGradient id="paint1_linear_1526_7486" x1="21" y1="12.0269" x2="3" y2="12.0269" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFBA1"/>
                <stop offset="1" stopColor="#58E877"/>
                </linearGradient>
                </defs>
              </svg>
            }
            title="Безлимитные сохранения"
            subtitle="Сохраняйте сколько угодно"
          />
        </div>
      </div>
      
      {/* Subscription plan */}
      <div className="mb-6 p-0.5 rounded-xl bg-gradient-to-r from-[#58E877] to-[#FFFBA1]">
        <div className="bg-[#121212] rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white text-sm">3 дня тест</p>
              <p className="text-white/60 text-sm line-through">390 ₽</p>
              <p className="text-white font-medium">1 ₽</p>
            </div>
          </div>
          <div className="bg-white rounded-lg px-2 py-1">
            <span className="text-black text-xs font-medium">Выгода 90%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
