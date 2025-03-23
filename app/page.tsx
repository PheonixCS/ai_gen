"use client";
import React, { useState, useRef, useEffect } from "react"; // Added React import to fix UMD global error
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import authService from "@/services/auth.service";

interface Testimonial {
  text: string;
  author: string;
  rating: number; // Adding rating for stars
  title: string; // Added title field
}

interface Stage {
  title: string;
  description: string;
  image: string;
  buttonText: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  testimonials?: Testimonial[];
}

const stages: Stage[] = [
  {
    title: "Все в одном",
    description: "Множество функций для редактирования изображений - в одном универсальном приложении",
    image: "/intro/stage1.png",
    buttonText: "Продолжить",
    secondaryButtonText: "Войти",
    secondaryButtonLink: "/login"
  },
  {
    title: "Незаменимый помощник",
    description: "Пользователь выбирает - нейросеть делает.\nЗагрузите изображение и выберите желаемый стиль или эффект",
    image: "/intro/stage2.mp4",
    buttonText: "Продолжить"
  },
  {
    title: "Простой интерфейс",
    description: "Изменяйте изображение и настраивайте параметры обработки без лишних проблем",
    image: "/intro/stage3.mp4",
    buttonText: "Продолжить"
  },
  {
    title: "Нам доверяют",
    description: "Создем решения, которые вдохноляют пользователей на новые свершения!",
    image: "", // No image for testimonials stage
    buttonText: "Начать бесплатно",
    testimonials: [
      { 
        title: "Превосходный результат",
        text: "Отличный сервис! Очень доволен результатами, фотографии получаются реалистичными и качественными.", 
        author: "Иван Иванов", 
        rating: 5.0 
      },
      { 
        title: "Идеально для проектов",
        text: "AI Photo Gen помог мне создать потрясающие изображения для моего проекта. Рекомендую всем!", 
        author: "Анна Смирнова", 
        rating: 4.9 
      },
      { 
        title: "Интуитивный интерфейс",
        text: "Простой и удобный интерфейс, а результаты превзошли все ожидания.", 
        author: "Петр Петров", 
        rating: 4.7 
      },
      { 
        title: "Экономит время",
        text: "Использую сервис для бизнеса, экономит много времени на создание контента.", 
        author: "Мария Козлова", 
        rating: 4.8 
      },
      { 
        title: "Лучший в своём классе",
        text: "Лучший AI генератор изображений, который я использовал. Очень точно выполняет запросы.", 
        author: "Алексей Новиков", 
        rating: 5.0 
      }
    ]
  }
];

// Helper function to determine if file is a video
const isVideo = (file: string): boolean => {
  return file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov');
};

export default function Home() {
  const [currentStage, setCurrentStage] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const router = useRouter();

  // Check if user is authenticated and redirect to /home if they are
  useEffect(() => {
    if (authService.isAuthenticated()) {
      console.log('User is already authenticated, redirecting to home page');
      router.replace('/home');
    }
  }, [router]);

  // This effect resets/plays videos when the stage changes
  useEffect(() => {
    // Play current video if applicable
    if (isVideo(stages[currentStage].image) && videoRefs.current[currentStage]) {
      const video = videoRefs.current[currentStage];
      if (video) {
        video.currentTime = 0; // Reset to beginning
        video.play().catch(e => console.log("Video play failed:", e));
      }
    }
  }, [currentStage]);

  const handleContinue = () => {
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    } else {
      window.location.href = "/register";
    }
  };

  // Initialize refs for videos
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, stages.length);
  }, []);

  // Render media content based on file type
  const renderMedia = () => {
    const src = stages[currentStage].image;
    
    // If we're on the testimonials page (stage 3) or there's no image, don't render media
    if (currentStage === 3 || !src) {
      return null;
    }
    
    if (isVideo(src)) {
      return (
        <div className="w-full flex items-center justify-center" style={{ height: "45vh" }}>
          <video 
            ref={(el) => {
              // Fixed ref callback to not return a value
              if (videoRefs.current) {
                videoRefs.current[currentStage] = el;
              }
            }}
            src={src}
            className="rounded-xl shadow-2xl h-full w-auto max-w-full object-contain"
            autoPlay
            playsInline
            muted
            loop
          />
        </div>
      );
    } else {
      return (
        <div className="w-full flex items-center justify-center" style={{ height: "45vh" }}>
          <div className="relative h-full w-full flex items-center justify-center">
            <Image 
              src={src} 
              alt={stages[currentStage].title} 
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
              className="rounded-xl shadow-2xl object-cover"
              priority={currentStage === 0} // Prioritize loading the first stage image
            />
          </div>
        </div>
      );
    }
  };

  // Render rating badge instead of stars
  const renderRatingBadge = (rating: number) => {
    // Format rating to 1 decimal place
    const formattedRating = rating.toFixed(1);
    
    return (
      <div className="px-2.5 py-1 bg-gradient-to-r from-[#58E877] to-[#FFFBA1] rounded-md text-black text-xs font-bold shadow-glow transition-transform hover:scale-105">
        {formattedRating}
      </div>
    );
  };

  // Render testimonials carousel
  const renderTestimonials = () => {
    if (!stages[currentStage].testimonials) return null;
    
    return (
      <div className="w-full relative max-w-sm mt-6">
        {/* Top blur effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0F0F0F] to-transparent z-10"></div>
        
        {/* Testimonials carousel */}
        <div className="overflow-hidden h-64">
          <div className="animate-testimonials py-8">
            {[...stages[currentStage].testimonials, ...stages[currentStage].testimonials].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-[#151515] rounded-lg p-4 mb-4 border border-white/8 transition-all duration-300 hover:border-white/20"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-white font-bold text-sm tracking-wide">{testimonial.title}</h4>
                  {renderRatingBadge(testimonial.rating)}
                </div>
                <p className="text-white/50 text-xs ">- {testimonial.author}</p>
                <p className="text-white/80 text-xs leading-relaxed mt-2">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom blur effect */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0F0F0F] to-transparent z-10"></div>
      </div>
    );
  };

  // Helper function to render text with line breaks
  const renderDescriptionWithLineBreaks = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="onboarding-container bg-[#0F0F0F] text-white">
      <div className="onboarding-content">
        {/* Main content area (media, title, description) */}
        <div className="onboarding-main-content">
          {renderMedia()}
          {currentStage === 3 && renderTestimonials()}
          
          <h2 className="text-2xl md:text-3xl font-bold text-center mt-4 md:mt-5">
            {stages[currentStage].title}
          </h2>
          
          <p className="text-white/70 text-sm md:text-base text-center max-w-[95%] mt-2">
            {renderDescriptionWithLineBreaks(stages[currentStage].description)}
          </p>
          
          {/* Testimonials section - only for stage 3 */}
          
        </div>
        
        {/* Action buttons with appropriate spacing */}
        <div className="onboarding-actions flex flex-col w-full gap-3">
          <button 
            onClick={handleContinue} 
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium text-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {stages[currentStage].buttonText}
          </button>
          
          {stages[currentStage].secondaryButtonText && stages[currentStage].secondaryButtonLink && (
            <Link 
              href={stages[currentStage].secondaryButtonLink} 
              className="w-full py-3 rounded-lg border border-white/20 text-white/90 text-center transition-colors hover:bg-white/5"
            >
              {stages[currentStage].secondaryButtonText}
            </Link>
          )}
        </div>
        
        {/* Progress indicators */}
        <div className="flex gap-2 mt-2 md:mt-3">
          {stages.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full ${currentStage === index ? 'bg-[#58E877]' : 'bg-white/30'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
