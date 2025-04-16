"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';
import Link from 'next/link';
import Image from 'next/image';

// Tool card interface
interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  bgImage: string;
  comingSoon?: boolean;
}

// Tool cards data
const toolCards: ToolCard[] = [
  {
    id: 'generate',
    title: 'Генерация изображений',
    description: 'Создавайте уникальные изображения на основе текстового описания',
    icon: '/icons/generate.svg',
    bgImage: '/32cbb5505093c8cbe349effadeff5b8c1be824a3.png'
  },
  {
    id: 'enhance',
    title: 'Улучшение качества',
    description: 'Увеличение разрешения и улучшение деталей изображения',
    icon: '/icons/enhance.svg',
    bgImage: '/48a3ff36876341ae62774d88d019e9bd.png'
  },
  {
    id: 'backgrounds',
    title: 'Создание фонов и контента',
    description: 'Создавайте профессиональные фоны для ваших проектов',
    icon: '/icons/backgrounds.svg',
    bgImage: '/211929c28d0f93a44e62b999d731e28b.png'
  },
  {
    id: 'remove',
    title: 'Удаление объектов',
    description: 'Интеллектуальное удаление нежелательных объектов с фото',
    icon: '/icons/remove.svg',
    bgImage: '/c1dddd94a03f71c7e5c341ee7e3ec697.png',
    // comingSoon: true
  },
  {
    id: 'face',
    title: 'Изменение лица',
    description: 'Изменение выражения лица, возраста и других параметров',
    icon: '/icons/face.svg',
    bgImage: '/05f70b6fe1f85ce6886d7dbe22dd8e3d.png',
  },
  {
    id: 'style',
    title: 'Стилизация изображения',
    description: 'Применение различных художественных стилей к фотографиям',
    icon: '/icons/style.svg',
    bgImage: '/7ccc1783884cd40390ab6f620f5aa5c3.png'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string, userId?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    console.log('Checking authentication on home page');
    
    // Direct check of localStorage for debugging purposes
    const userStr = localStorage.getItem('user');
    console.log('Raw localStorage user data:', userStr);
    
    // Normal authentication flow
    if (!authService.isAuthenticated()) {
      console.log('Not authenticated according to authService, redirecting to login');
      
      // FALLBACK: Check if we at least have data in localStorage before redirecting
      if (userStr) {
        console.warn("User data exists in localStorage but authentication failed. Attempting recovery...");
        try {
          // Try to manually parse and use the user data
          const userData = JSON.parse(userStr);
          console.log("Recovered user data:", userData);
          setUser(userData);
          setLoading(false);
          return; // Skip the redirect
        } catch (e) {
          console.error("Failed to recover user data:", e);
        }
      }
      
      router.replace('/login');
      return;
    }
    
    // If authenticated, proceed as normal
    const currentUser = authService.getCurrentUser();
    console.log('User is authenticated:', currentUser);
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  const handleToolClick = (toolId: string) => {
    const tool = toolCards.find(t => t.id === toolId);
    if (tool?.comingSoon) {
      alert('Этот инструмент будет доступен в ближайшее время!');
      return;
    }
    
    // Navigate to ai_gen page for all tools
    router.push('/ai_gen');
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
          <h1 className="text-xl font-bold">AI Photo Gen</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* History icon - Updated with link to history page */}
          <Link href="/history" className="w-10 h-10 rounded-full bg-[#151515] flex items-center justify-center hover:bg-[#252525] transition-all" aria-label="История генераций">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.05176 11.5C3.27428 8.31764 5.33646 5.6277 8.23965 4.49587C11.1428 3.36404 14.4569 4.00002 16.75 6.00002" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.9482 11.5C20.7257 14.6824 18.6635 17.3723 15.7604 18.5042C12.8572 19.636 9.54311 19 7.25 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 3L21 6L17 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 21L3 18L7 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          
          {/* Profile icon */}
          <Link href="/profile" className="w-10 h-10 rounded-full bg-[#151515] flex items-center justify-center hover:bg-[#252525] transition-all" aria-label="Настройки профиля">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 20C6 17.2386 8.68629 15 12 15C15.3137 15 18 17.2386 18 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Create button */}
        <div className="mb-8 flex justify-center">
          <button className="create-button" onClick={() => router.push('/ai_gen')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16" stroke="url(#plusGradient)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M4 10H16" stroke="url(#plusGradient)" strokeWidth="1.5" strokeLinecap="round"/>
              <defs>
                <linearGradient id="plusGradient" x1="4" y1="10" x2="16" y2="10" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#58E877"/>
                  <stop offset="1" stopColor="#FFFBA1"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="button-text">СОЗДАТЬ</span>
          </button>
        </div>
        
        {/* Tool cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolCards.map((tool) => (
            <div 
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`
                tool-card relative rounded-xl overflow-hidden cursor-pointer
                h-[200px] transition-all duration-300 ${tool.comingSoon ? 'opacity-80' : ''}
              `}
            >
              {/* Background image */}
              <div className="absolute inset-0 w-full h-full">
                <Image 
                  src={tool.bgImage} 
                  alt={tool.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={tool.id === 'generate'} // Prioritize loading the first tool image
                />
              </div>
              
              {/* Text overlay with gradient and blur */}
              <div className="absolute inset-x-0 bottom-0 m-0 w-full card-content-overlay">
                <div className="p-3 relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent card's click
                      if (!tool.comingSoon) {
                        router.push('/ai_gen');
                      }
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 bg-[#151515]/60 backdrop-blur-sm rounded-lg 
                      flex items-center justify-center transition-all duration-300
                      hover:bg-gradient-to-r hover:from-[#58E877]/80 hover:to-[#FFFBA1]/80
                      hover:scale-110 hover:shadow-[0_0_10px_rgba(88,232,119,0.5)]
                      active:scale-95 
                      ${tool.comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label={`Перейти к генерации изображения`}
                    disabled={tool.comingSoon}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.3335 4.1173C3.3335 4.32531 3.41613 4.52481 3.56322 4.67189C3.7103 4.81898 3.9098 4.90161 4.11781 4.90161L9.9884 4.90161L3.56369 11.3271C3.42082 11.475 3.34177 11.6731 3.34356 11.8788C3.34534 12.0844 3.42783 12.2812 3.57325 12.4266C3.71866 12.572 3.91538 12.6545 4.12102 12.6563C4.32667 12.658 4.52479 12.579 4.67271 12.4361L11.0982 6.01103L11.0982 11.882C11.0982 12.09 11.1808 12.2895 11.3279 12.4366C11.475 12.5837 11.6745 12.6663 11.8825 12.6663C12.0905 12.6663 12.29 12.5837 12.4371 12.4366C12.5842 12.2895 12.6668 12.09 12.6668 11.882L12.6668 4.1173C12.6668 3.90929 12.5842 3.70979 12.4371 3.56271C12.29 3.41562 12.0905 3.33299 11.8825 3.33299L4.11781 3.33299C3.9098 3.33299 3.7103 3.41562 3.56322 3.56271C3.41613 3.70979 3.3335 3.90929 3.3335 4.1173Z" fill="#F0F6F3" className="group-hover:fill-black transition-colors duration-300"/>
                    </svg>
                  </button>
                  <h3 className="text-lg font-medium mb-1 text-white">{tool.title}</h3>
                  <p className="text-white/90 text-sm">{tool.description}</p>
                </div>
              </div>
              
              {tool.comingSoon && (
                <div className="absolute top-4 left-4 bg-[#58E877] text-black text-xs font-medium px-2 py-1 rounded z-10">
                  Скоро
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-4 border-t border-white/10 text-center text-white/50 text-sm">
        <p>© 2025 AI Photo Gen. Все права защищены.</p>
      </footer>
    </div>
  );
}
