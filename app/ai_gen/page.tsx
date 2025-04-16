"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Image from 'next/image';
import { aiGenerationService, ApiImagesResponse, GenerateImageParams } from '@/services/ai_gen.service';
import AspectRatioSelector from '@/components/AspectRatioSelector';
import config from '@/config/api-config';
import { AuthService } from '@/services/auth.service';
import { tree } from 'next/dist/build/templates/app-page';
import SubscriptionCard from '../../components/SubscriptionCard';

type Tool = 'generate' | 'enhance' | 'background';

// Define a proper interface for API error responses
interface ApiErrorResponse {
  code: number;
  msg: string;
  current_count?: number;
  limit?: number;
}

export default function GenerateImagePage() {
  type ApiError = {
    status: string;
    message: string;
    code: number;
    current_count?: number;
    limit?: number;
    is_subscribed?: boolean;
  };
  // Inside your component, add these state variables
  const [showAspectRatioSelector, setShowAspectRatioSelector] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '4:3' | '16:9' | '3:4' | '9:16'>('1:1');
  const [showSubscriptionCard, setShowSubscriptionCard] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('photographic'); // Default style from API docs

  // Add this handler function
  const handleAspectRatioChange = (ratio: '1:1' | '4:3' | '16:9' | '3:4' | '9:16') => {
    setSelectedAspectRatio(ratio);
  };
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('generate');
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingTimeoutId, setLoadingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  // Auto resize textarea based on content
  useEffect(() => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.style.height = 'auto';
      promptTextareaRef.current.style.height = `${promptTextareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleImageResponse = (image: unknown) => {
    console.log('Generated image data:', image);
    
    // Проверяем, что ответ является объектом и содержит поле 'code'
    if (typeof image === 'object' && image !== null && 'code' in image) {
      const apiResponse = image as ApiError;
      
      // Обрабатываем случай, когда это ошибка 403
      if (apiResponse.code === 403) {
        setError(apiResponse);
        return true; // Возвращаем true, если это ошибка лимита
      }
    }
    
    return false; // Это не ошибка лимита
  };

  // Function to simulate loading progress
  const simulateLoadingProgress = (duration: number) => {
    // Clear any existing timeouts
    if (loadingTimeoutId) {
      clearTimeout(loadingTimeoutId);
    }
    
    setProgress(0);
    
    // Start time
    const startTime = Date.now();
    
    // Update progress function
    const updateProgress = () => {
      const elapsedTime = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsedTime / duration) * 100, 100);
      
      setProgress(calculatedProgress);
      
      if (calculatedProgress < 100) {
        const timeoutId = setTimeout(updateProgress, 50);
        setLoadingTimeoutId(timeoutId);
      }
    };
    
    // Start updating progress
    updateProgress();
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    setShowSubscriptionCard(false); // Reset subscription card visibility
    
    // Create a variable to track if we need to show the subscription card
    let showSubCard = false;
    
    try {
      // Check if user is authenticated
      let authService = new AuthService();
      let user = await authService.getCurrentUser();
      
      // Start loading simulation regardless of subscription status
      simulateLoadingProgress(7000);
      
      // Create parameters object according to API documentation
      let params: GenerateImageParams = {
        prompt: prompt,
        style_preset: selectedStyle,
        aspect_ratio: selectedAspectRatio,
        output_format: 'png',
      };
      
      // Get user credentials for authentication
      let email = user?.email || '';
      let password = user?.password || '';
      
      try {
        const response = await aiGenerationService.generateImage(
          params,
          email,
          password,
        );
        
        console.log('API Response:', response);
        
        // Check if the response itself contains an error code
        if (response && 'code' in response && 'msg' in response) {
          // This is an API error response in the shape of { code: number, msg: string }
          const apiErrorResponse = response as ApiErrorResponse;
          
          if (apiErrorResponse.code === 403 && apiErrorResponse.msg === "subscription_required") {
            console.log('Subscription required detected in response');
            showSubCard = true;
          } else {
            // For other API error codes, set the error state
            setError({
              code: apiErrorResponse.code,
              message: apiErrorResponse.msg,
              status: 'error'
            });
          }
        } else if (response && 'image_url' in response) {
          // If we have a valid image URL, store it
          setGeneratedImageUrl(response.image_url as string);
        } else {
          throw new Error('Failed to get image URL from server');
        }
      } catch (error) {
        console.error('API Error:', error);
        
        // Check if the error object has the structure we expect
        if (typeof error === 'object' && error !== null) {
          if ('code' in error && 'msg' in error) {
            // Handle API error responses that come through the catch block
            const apiErrorResponse = error as ApiErrorResponse;
            
            if (apiErrorResponse.code === 403 && apiErrorResponse.msg === "subscription_required") {
              console.log('Subscription required detected in error');
              showSubCard = true;
            } else {
              // For other error types, set the error state
              setError({
                code: apiErrorResponse.code,
                message: apiErrorResponse.msg,
                status: 'error'
              });
            }
          } else if (error instanceof Error) {
            // Handle standard Error objects
            setError({
              status: 'error',
              message: error.message,
              code: 500
            });
          } else {
            // Fallback for non-Error objects
            setError({
              status: 'error',
              message: 'Unknown error',
              code: 500
            });
          }
        } else {
          // Fallback for non-object errors
          setError({
            status: 'error',
            message: 'Неизвестная ошибка',
            code: 500
          });
        }
      }
    } catch (generalError) {
      console.error('General error in handleGenerateImage:', generalError);
      
      let errorMessage = 'Ошибка при обработке запроса';
      
      if (generalError instanceof Error) {
        errorMessage = generalError.message;
      }
      
      setError({
        status: 'error',
        message: errorMessage,
        code: 500
      });
    } finally {
      // Wait for the full loading animation to complete before showing subscription card or stopping loading
      setTimeout(() => {
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
          setLoadingTimeoutId(null);
        }
        
        setIsGenerating(false);
        setProgress(0);
        
        // Show the subscription card if needed
        if (showSubCard) {
          setShowSubscriptionCard(true);
        }
      }, 7000);
    }
  };

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1252 20.9999C15.9332 20.9999 15.7412 20.9264 15.5949 20.7802L7.34494 12.5302C7.05169 12.2369 7.05169 11.7629 7.34494 11.4697L15.5949 3.21969C15.8882 2.92644 16.3622 2.92644 16.6554 3.21969C16.9487 3.51294 16.9487 3.98694 16.6554 4.28019L8.93569 11.9999L16.6554 19.7197C16.9487 20.0129 16.9487 20.4869 16.6554 20.7802C16.5092 20.9264 16.3172 20.9999 16.1252 20.9999Z" fill="#F0F6F3"/>
            </svg>
          </button>
        </div>
        
        {/* Center title */}
        <h2 className="text-[18px] leading-[24px] font-semibold text-center">
          Генерация фото
        </h2>
        
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/home')} 
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_1490_514" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="3" y="3" width="18" height="18">
                <path d="M3 3H21V21H3V3Z" fill="white"/>
              </mask>
              <g mask="url(#mask0_1490_514)">
                <path d="M12.4411 4.64344C12.1782 4.45219 11.8219 4.45219 11.5589 4.64344L3.30892 10.6435C3.0462 10.8345 2.93635 11.173 3.03681 11.4819C3.13727 11.7909 3.4252 12 3.75005 12H5.25005V18.75C5.25005 19.1642 5.58583 19.5 6.00005 19.5H18.0001C18.4143 19.5 18.7501 19.1642 18.7501 18.75V12H20.2501C20.5749 12 20.8628 11.7909 20.9633 11.4819C21.0637 11.173 20.9539 10.8345 20.6912 10.6435L12.4411 4.64344Z" fill="#F0F6F3"/>
              </g>
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {/* Prompt input area - removed visual styling */}
        <div className="mb-6">
          <textarea
            ref={promptTextareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Опишите, что вы хотите увидеть на изображении..."
            className="w-full rounded-lg p-4 text-white resize-none min-h-[100px] max-h-[200px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-[#58E877]/50"
            maxLength={1000}
            rows={3}
          ></textarea>
        </div>

        {/* Generated image area - removed visual styling when empty */}
        <div className="mb-8 flex justify-center items-center min-h-[300px] overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center p-8 w-full">
              {/* Replace the spinner with progress bar */}
              <div className="w-full max-w-md mb-4">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#58E877] to-[#FFFBA1] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <p className="text-white/70">Генерация изображения... {Math.round(progress)}%</p>
            </div>
          ) : showSubscriptionCard ? (
            <SubscriptionCard onClose={() => setShowSubscriptionCard(false)} />
          ) : error?.code === 403 && error.message === 'daily_limit_exceeded' ? (  
            <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl max-w-md mx-auto">
              <div className="text-red-400 font-medium mb-3 text-center">
                Вы израсходовали лимит бесплатных генераций ({error.current_count}/{error.limit})
              </div>
              <p className="text-white/70 text-sm mb-4 text-center">
                Для неограниченного доступа оформите PRO подписку
              </p>
              <button 
                onClick={() => window.location.href = '/subscribe'} // Замените на ваш путь
                className="w-full py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium text-center text-sm sm:text-base transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Активировать PRO доступ
              </button>
            </div>
          ) : generatedImageUrl ? (
            <div className="w-full h-full relative">
              <img
                src={generatedImageUrl}
                alt="Generated image"
                className="w-full h-auto object-contain"
              />
              {/* Нужно на изображение наложить две кнопки, скачать и поделится */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImageUrl || '';
                    link.download = 'generated_image.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="group bg-black/30 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:bg-black/50 hover:shadow-lg hover:scale-105"
                >
                  <CloudDownloadIcon 
                    className="w-6 h-6 text-white"
                    sx={{ fontSize: 24 }}
                  />
                </button>
                <button 
                  onClick={() => {
                    if (generatedImageUrl) {
                      navigator.clipboard.writeText(generatedImageUrl)
                        .then(() => console.log('Ссылка скопирована в буфер обмена!'))
                        .catch(() => console.log('Не удалось скопировать ссылку'));
                    } else {
                      console.log('Изображение не готово для sharing');
                    }
                  }}
                  className="group bg-black/30 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:bg-black/50 hover:shadow-lg hover:scale-105"
                >
                  <ShareIcon 
                    className="w-6 h-6 text-white"
                    sx={{ fontSize: 24 }}
                  />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30 mb-3">
                <path d="M20.2201 18.3845C20.0656 18.3845 19.9403 18.2592 19.9403 18.1046V13.3377C19.9403 13.1831 20.0656 13.0579 20.2201 13.0579C20.3747 13.0579 20.5 12.9326 20.5 12.778V11.2222C20.5 11.0676 20.3747 10.9423 20.2201 10.9423C20.0656 10.9423 19.9403 10.817 19.9403 10.6625V5.89539C19.9403 5.74083 20.0656 5.61554 20.2201 5.61554C20.3747 5.61554 20.5 5.49024 20.5 5.33568V4.20833C20.5 3.81713 20.1829 3.5 19.7917 3.5H18.6643C18.5098 3.5 18.3845 3.62529 18.3845 3.77985C18.3845 3.93441 18.2592 4.05971 18.1046 4.05971H13.3709C13.2163 4.05971 13.0911 3.93441 13.0911 3.77985C13.0911 3.62529 12.9658 3.5 12.8112 3.5H11.2552C11.1006 3.5 10.9754 3.62529 10.9754 3.77985C10.9754 3.93441 10.8501 4.05971 10.6955 4.05971H5.89539C5.74083 4.05971 5.61554 3.93441 5.61554 3.77985C5.61554 3.62529 5.49024 3.5 5.33568 3.5H4.20833C3.81713 3.5 3.5 3.81713 3.5 4.20833V5.33568C3.5 5.49024 3.62529 5.61554 3.77985 5.61554C3.93441 5.61554 4.05971 5.74083 4.05971 5.89539V10.6625C4.05971 10.817 3.93441 10.9423 3.77985 10.9423C3.62529 10.9423 3.5 11.0676 3.5 11.2222V12.778C3.5 12.9326 3.62529 13.0579 3.77985 13.0579C3.93441 13.0579 4.05971 13.1831 4.05971 13.3377V18.1046C4.05971 18.2592 3.93441 18.3845 3.77985 18.3845C3.62529 18.3845 3.5 18.5098 3.5 18.6643V19.7917C3.5 20.1829 3.81713 20.5 4.20833 20.5H5.33568C5.49024 20.5 5.61554 20.3747 5.61554 20.2201C5.61554 20.0656 5.74083 19.9403 5.89539 19.9403H10.6955C10.8501 19.9403 10.9754 20.0656 10.9754 20.2201C10.9754 20.3747 11.1006 20.5 11.2552 20.5H12.8112C12.9658 20.5 13.0911 20.3747 13.0911 20.2201C13.0911 20.0656 13.2163 19.9403 13.3709 19.9403H18.1046C18.2592 19.9403 18.3845 20.0656 18.3845 20.2201C18.3845 20.3747 18.5098 20.5 18.6643 20.5H19.7917C20.1829 20.5 20.5 20.1829 20.5 19.7917V18.6643C20.5 18.5098 20.3747 18.3845 20.2201 18.3845ZM18.9442 18.3845H18.6643C18.5098 18.3845 18.3845 18.5098 18.3845 18.6643C18.3845 18.8189 18.2592 18.9442 18.1046 18.9442H13.3708C13.2163 18.9442 13.0911 18.8189 13.0911 18.6644C13.0911 18.5099 12.9658 18.3846 12.8113 18.3846H11.2551C11.1006 18.3846 10.9754 18.5099 10.9754 18.6644C10.9754 18.8189 10.8501 18.9442 10.6956 18.9442H5.89539C5.74083 18.9442 5.61554 18.8189 5.61554 18.6643C5.61554 18.5098 5.49023 18.3845 5.33568 18.3845C5.18111 18.3845 5.0558 18.2592 5.0558 18.1046V13.3377C5.0558 13.1831 5.18109 13.0579 5.33565 13.0579C5.49021 13.0579 5.6155 12.9326 5.6155 12.778V11.2222C5.6155 11.0676 5.49021 10.9423 5.33565 10.9423C5.18109 10.9423 5.0558 10.817 5.0558 10.6625V5.89539C5.0558 5.74083 5.18109 5.61554 5.33565 5.61554C5.49021 5.61554 5.6155 5.49023 5.6155 5.33568C5.6155 5.18111 5.74081 5.0558 5.89537 5.0558H10.6956C10.8501 5.0558 10.9754 5.18106 10.9754 5.33558C10.9754 5.49011 11.1006 5.61537 11.2551 5.61537H12.8113C12.9658 5.61537 13.0911 5.49011 13.0911 5.33558C13.0911 5.18106 13.2163 5.0558 13.3708 5.0558H18.1046C18.2592 5.0558 18.3845 5.18109 18.3845 5.33565C18.3845 5.49021 18.5098 5.6155 18.6643 5.6155C18.8189 5.6155 18.9442 5.7408 18.9442 5.89536V10.6624C18.9442 10.817 18.8189 10.9423 18.6643 10.9423C18.5098 10.9423 18.3845 11.0676 18.3845 11.2221V12.778C18.3845 12.9325 18.5098 13.0578 18.6643 13.0578C18.8189 13.0578 18.9442 13.1831 18.9442 13.3377V18.3844C18.9442 18.3844 18.9442 18.3845 18.9442 18.3845Z" fill="#F0F6F3"/>
                <path d="M8.11035 8.81991C8.11035 8.4287 8.42748 8.11157 8.81868 8.11157H15.1789C15.5701 8.11157 15.8872 8.4287 15.8872 8.81991V15.1801C15.8872 15.5713 15.5701 15.8884 15.1789 15.8884H8.81868C8.42748 15.8884 8.11035 15.5713 8.11035 15.1801V8.81991Z" fill="#F0F6F3"/>
              </svg>
              <p className="text-white/50 text-center">Здесь будет ваше сгенерированное изображение</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Tools panel */}
      <footer className="border-t border-white/10 pb-6">
        {/* Top tools row - removed background */}
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              disabled={isGenerating}
              onClick={() => setShowAspectRatioSelector(!showAspectRatioSelector)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.2201 18.3845C20.0656 18.3845 19.9403 18.2592 19.9403 18.1046V13.3377C19.9403 13.1831 20.0656 13.0579 20.2201 13.0579C20.3747 13.0579 20.5 12.9326 20.5 12.778V11.2222C20.5 11.0676 20.3747 10.9423 20.2201 10.9423C20.0656 10.9423 19.9403 10.817 19.9403 10.6625V5.89539C19.9403 5.74083 20.0656 5.61554 20.2201 5.61554C20.3747 5.61554 20.5 5.49024 20.5 5.33568V4.20833C20.5 3.81713 20.1829 3.5 19.7917 3.5H18.6643C18.5098 3.5 18.3845 3.62529 18.3845 3.77985C18.3845 3.93441 18.2592 4.05971 18.1046 4.05971H13.3709C13.2163 4.05971 13.0911 3.93441 13.0911 3.77985C13.0911 3.62529 12.9658 3.5 12.8112 3.5H11.2552C11.1006 3.5 10.9754 3.62529 10.9754 3.77985C10.9754 3.93441 10.8501 4.05971 10.6955 4.05971H5.89539C5.74083 4.05971 5.61554 3.93441 5.61554 3.77985C5.61554 3.62529 5.49024 3.5 5.33568 3.5H4.20833C3.81713 3.5 3.5 3.81713 3.5 4.20833V5.33568C3.5 5.49024 3.62529 5.61554 3.77985 5.61554C3.93441 5.61554 4.05971 5.74083 4.05971 5.89539V10.6625C4.05971 10.817 3.93441 10.9423 3.77985 10.9423C3.62529 10.9423 3.5 11.0676 3.5 11.2222V12.778C3.5 12.9326 3.62529 13.0579 3.77985 13.0579C3.93441 13.0579 4.05971 13.1831 4.05971 13.3377V18.1046C4.05971 18.2592 3.93441 18.3845 3.77985 18.3845C3.62529 18.3845 3.5 18.5098 3.5 18.6643V19.7917C3.5 20.1829 3.81713 20.5 4.20833 20.5H5.33568C5.49024 20.5 5.61554 20.3747 5.61554 20.2201C5.61554 20.0656 5.74083 19.9403 5.89539 19.9403H10.6955C10.8501 19.9403 10.9754 20.0656 10.9754 20.2201C10.9754 20.3747 11.1006 20.5 11.2552 20.5H12.8112C12.9658 20.5 13.0911 20.3747 13.0911 20.2201C13.0911 20.0656 13.2163 19.9403 13.3709 19.9403H18.1046C18.2592 19.9403 18.3845 20.0656 18.3845 20.2201C18.3845 20.3747 18.5098 20.5 18.6643 20.5H19.7917C20.1829 20.5 20.5 20.1829 20.5 19.7917V18.6643C20.5 18.5098 20.3747 18.3845 20.2201 18.3845ZM18.9442 18.3845H18.6643C18.5098 18.3845 18.3845 18.5098 18.3845 18.6643C18.3845 18.8189 18.2592 18.9442 18.1046 18.9442H13.3708C13.2163 18.9442 13.0911 18.8189 13.0911 18.6644C13.0911 18.5099 12.9658 18.3846 12.8113 18.3846H11.2551C11.1006 18.3846 10.9754 18.5099 10.9754 18.6644C10.9754 18.8189 10.8501 18.9442 10.6956 18.9442H5.89539C5.74083 18.9442 5.61554 18.8189 5.61554 18.6643C5.61554 18.5098 5.49023 18.3845 5.33568 18.3845C5.18111 18.3845 5.0558 18.2592 5.0558 18.1046V13.3377C5.0558 13.1831 5.18109 13.0579 5.33565 13.0579C5.49021 13.0579 5.6155 12.9326 5.6155 12.778V11.2222C5.6155 11.0676 5.49021 10.9423 5.33565 10.9423C5.18109 10.9423 5.0558 10.817 5.0558 10.6625V5.89539C5.0558 5.74083 5.18109 5.61554 5.33565 5.61554C5.49021 5.61554 5.6155 5.49023 5.6155 5.33568C5.6155 5.18111 5.74081 5.0558 5.89537 5.0558H10.6956C10.8501 5.0558 10.9754 5.18106 10.9754 5.33558C10.9754 5.49011 11.1006 5.61537 11.2551 5.61537H12.8113C12.9658 5.61537 13.0911 5.49011 13.0911 5.33558C13.0911 5.18106 13.2163 5.0558 13.3708 5.0558H18.1046C18.2592 5.0558 18.3845 5.18109 18.3845 5.33565C18.3845 5.49021 18.5098 5.6155 18.6643 5.6155C18.8189 5.6155 18.9442 5.7408 18.9442 5.89536V10.6624C18.9442 10.817 18.8189 10.9423 18.6643 10.9423C18.5098 10.9423 18.3845 11.0676 18.3845 11.2221V12.778C18.3845 12.9325 18.5098 13.0578 18.6643 13.0578C18.8189 13.0578 18.9442 13.1831 18.9442 13.3377V18.3844C18.9442 18.3844 18.9442 18.3845 18.9442 18.3845Z" fill="#F0F6F3"/>
                <path d="M8.11035 8.81991C8.11035 8.4287 8.42748 8.11157 8.81868 8.11157H15.1789C15.5701 8.11157 15.8872 8.4287 15.8872 8.81991V15.1801C15.8872 15.5713 15.5701 15.8884 15.1789 15.8884H8.81868C8.42748 15.8884 8.11035 15.5713 8.11035 15.1801V8.81991Z" fill="#F0F6F3"/>
              </svg>
            </button>
            
            {/* Кнопки действий с изображением */}
            {generatedImageUrl && (
              <div className="flex space-x-2">
                {/* Удаление изображения */}
                <button 
                  disabled={isGenerating}
                  onClick={() => setGeneratedImageUrl(null)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                    isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                  }`}
                >
                  <DeleteIcon />
                </button>
                
                {/* Перегенерировать */}
                <button 
                  disabled={isGenerating}
                  onClick={handleGenerateImage}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                    isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                  }`}
                >
                  <AutorenewIcon />
                </button>
              </div>
            )}

            {/* <button 
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3.00003C10.4904 2.99801 9.00466 3.37632 7.67989 4.10003C6.35512 4.82374 5.23402 5.86954 4.42008 7.14087C3.60614 8.4122 3.1256 9.8681 3.02281 11.3742C2.92002 12.8802 3.1983 14.3879 3.83197 15.758C4.03157 16.2066 4.05302 16.7142 3.89197 17.178L3.05197 19.678C2.99418 19.8548 2.9865 20.0442 3.02977 20.2251C3.07304 20.406 3.16556 20.5714 3.29709 20.7029C3.42862 20.8344 3.594 20.927 3.77491 20.9702C3.95581 21.0135 4.14516 21.0058 4.32197 20.948L6.82197 20.108C7.28574 19.947 7.79343 19.9684 8.24197 20.168C9.46455 20.7337 10.7985 21.0177 12.1455 20.9991C13.4925 20.9805 14.8181 20.6598 16.0246 20.0606C17.2311 19.4614 18.2877 18.599 19.1165 17.537C19.9453 16.475 20.5251 15.2404 20.8131 13.9245C21.1012 12.6085 21.0902 11.2447 20.7809 9.93358C20.4716 8.62245 19.8719 7.39748 19.026 6.34902C18.1802 5.30055 17.1098 4.45534 15.8938 3.87571C14.6777 3.29608 13.3471 2.99683 12 3.00003ZM16.105 11.488L14.575 12.968C14.5199 13.0211 14.4787 13.0869 14.4548 13.1596C14.4309 13.2322 14.4251 13.3096 14.438 13.385L14.789 15.411C14.8045 15.5039 14.7938 15.5993 14.7581 15.6864C14.7223 15.7735 14.6629 15.8488 14.5866 15.904C14.5102 15.9591 14.42 15.9918 14.326 15.9983C14.2321 16.0049 14.1382 15.985 14.055 15.941L12.219 14.984C12.1511 14.9485 12.0756 14.93 11.999 14.93C11.9223 14.93 11.8469 14.9485 11.779 14.984L9.94497 15.94C9.86157 15.984 9.76755 16.0038 9.67351 15.9971C9.57947 15.9905 9.48915 15.9578 9.41273 15.9025C9.33632 15.8473 9.27684 15.7719 9.24102 15.6847C9.20519 15.5975 9.19444 15.502 9.20997 15.409L9.55997 13.385C9.57279 13.3096 9.56701 13.2322 9.54313 13.1596C9.51926 13.0869 9.47801 13.0211 9.42297 12.968L7.89297 11.488C7.83025 11.4268 7.78594 11.3492 7.76507 11.2641C7.7442 11.179 7.74759 11.0897 7.77487 11.0064C7.80214 10.9232 7.85221 10.8492 7.9194 10.7929C7.98658 10.7366 8.06819 10.7003 8.15497 10.688L10.271 10.388C10.3468 10.3773 10.419 10.3483 10.4812 10.3036C10.5433 10.2588 10.5937 10.1996 10.628 10.131L11.545 8.28803C11.587 8.20353 11.6517 8.13244 11.7319 8.08274C11.8121 8.03304 11.9046 8.00671 11.999 8.00671C12.0933 8.00671 12.1858 8.03304 12.266 8.08274C12.3462 8.13244 12.411 8.20353 12.453 8.28803L13.37 10.131C13.4042 10.1996 13.4546 10.2588 13.5168 10.3036C13.579 10.3483 13.6511 10.3773 13.727 10.388L15.843 10.688C15.9298 10.7001 16.0116 10.7363 16.0789 10.7926C16.1462 10.8488 16.1964 10.9228 16.2238 11.0061C16.2512 11.0894 16.2546 11.1787 16.2338 11.2639C16.213 11.3491 16.1687 11.4267 16.106 11.488H16.105Z" fill="#F0F6F3"/>
              </svg>
            </button> */}
          </div>
          
          {/* Generate button that appears when prompt has 5+ characters */}
          {prompt.length >= 5 && (
            <button 
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black text-sm font-medium rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Генерация...' : 'Сгенерировать'}
            </button>
          )}
        </div>
        
        {/* Aspect ratio selector - only shown when toggled */}
        {showAspectRatioSelector && (
          <AspectRatioSelector
            selectedRatio={selectedAspectRatio}
            onSelectRatio={handleAspectRatioChange}
            className="my-2 border-t border-b border-white/5"
          />
        )}
        {/* Bottom tools row with text */}
        <div className="max-w-3xl mx-auto px-4 pt-2 border-t border-white/10">
          <div className="flex items-start overflow-x-auto space-x-6 py-2 no-scrollbar">
            {/* Generate Photo tool - removed border for selected tool */}
            <button 
              onClick={() => handleToolChange('generate')} 
              // onClick={() => setShowAspectRatioSelector(!showAspectRatioSelector)}
              className={`flex flex-col items-center min-w-[80px] pt-2 pb-1 ${activeTool === 'generate' ? 'opacity-100' : 'opacity-70 hover:opacity-100'} focus:outline-none`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1">
                {/* Большая центральная звезда */}
                <path d="M12 3.5L14.416 8.39701L19.8541 9.22648L15.927 13.053L16.8926 18.4655L12 15.922L7.10736 18.4655L8.07301 13.053L4.14591 9.22648L9.58399 8.39701L12 3.5Z" 
                  fill={activeTool === 'generate' ? 'url(#gradient-star)' : '#F0F6F3'}
                  stroke={activeTool === 'generate' ? '#58E877' : '#F0F6F3'} 
                  strokeWidth="0.5"
                  strokeLinejoin="round"/>
                
                {/* Маленькая звезда (верхний правый угол) */}
                <path d="M19 3L20.163 5.42705L22.7553 5.82229L20.8777 7.65295L21.327 10.2327L19 9.025L16.673 10.2327L17.1223 7.65295L15.2447 5.82229L17.837 5.42705L19 3Z" 
                  fill={activeTool === 'generate' ? 'url(#gradient-star)' : '#F0F6F3'}
                  stroke={activeTool === 'generate' ? '#58E877' : '#F0F6F3'} 
                  strokeWidth="0.5"
                  strokeLinejoin="round"/>
                
                {/* Маленькая звезда (правый нижний угол) */}
                <path d="M19 14L20.163 16.427L22.7553 16.8223L20.8777 18.6529L21.327 21.2327L19 20.025L16.673 21.2327L17.1223 18.6529L15.2447 16.8223L17.837 16.427L19 14Z" 
                  fill={activeTool === 'generate' ? 'url(#gradient-star)' : '#F0F6F3'}
                  stroke={activeTool === 'generate' ? '#58E877' : '#F0F6F3'} 
                  strokeWidth="0.5"
                  strokeLinejoin="round"/>
                
                <defs>
                  <linearGradient id="gradient-star" x1="3" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#58E877"/>
                    <stop offset="1" stopColor="#FFFBA1"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className={`text-xs ${activeTool === 'generate' ? 'text-white' : 'text-white/70'}`}>Генерация<br/>фото</span>
            </button>
            
            {/* Enhance Photo tool - disabled */}
            <button 
              disabled
              className="flex flex-col items-center min-w-[80px] pt-2 pb-1 opacity-50 cursor-not-allowed relative"
            >
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-5 h-5 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 4.5V6.75H13.5V4.5H15.75V19.5H8.25V4.5H10.5ZM6.75 3C6.33579 3 6 3.33579 6 3.75V20.25C6 20.6642 6.33579 21 6.75 21H17.25C17.6642 21 18 20.6642 18 20.25V3.75C18 3.33579 17.6642 3 17.25 3H6.75Z" fill="#F0F6F3"/>
                </svg>
              </div>
              <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1">
                <path d="M11.4279 6.58183C10.6313 6.41484 10.0087 5.79222 9.84175 4.99566C9.79039 4.75058 9.57425 4.57501 9.32376 4.57501C9.07331 4.57501 8.85717 4.75055 8.80577 4.99566C8.63881 5.79222 8.0162 6.4148 7.21963 6.58176C6.97452 6.63316 6.79895 6.8493 6.79895 7.09975C6.79895 7.3502 6.97452 7.56638 7.21959 7.61774C8.01616 7.78473 8.63878 8.40735 8.80573 9.20392C8.8571 9.44899 9.07324 9.62456 9.32373 9.62456C9.57414 9.62456 9.79032 9.44899 9.84172 9.20392C10.0087 8.40735 10.6313 7.78477 11.4279 7.61781C11.673 7.56645 11.8485 7.35031 11.8485 7.09982C11.8485 6.8494 11.673 6.63323 11.4279 6.58183ZM21.3792 10.6254C20.4044 10.4211 19.6425 9.65917 19.4382 8.68443C19.3868 8.43933 19.1707 8.26376 18.9202 8.26376C18.6698 8.26376 18.4536 8.43929 18.4022 8.6844C18.1979 9.65917 17.4359 10.4211 16.4612 10.6254C16.2161 10.6767 16.0405 10.8929 16.0405 11.1434C16.0405 11.3938 16.2161 11.6099 16.4612 11.6614C17.4359 11.8657 18.1979 12.6275 18.4021 13.6023C18.4535 13.8474 18.6696 14.023 18.9201 14.023C19.1705 14.023 19.3867 13.8475 19.4381 13.6024C19.6425 12.6276 20.4044 11.8657 21.3792 11.6614C21.6243 11.6101 21.7998 11.3939 21.7998 11.1434C21.7998 10.893 21.6243 10.6768 21.3792 10.6254ZM15.7012 12.9576C15.8682 13.7542 16.4908 14.3768 17.2874 14.5438C17.5325 14.5952 17.708 14.8114 17.708 15.0618C17.708 15.3122 17.5325 15.5284 17.2874 15.5798C16.4908 15.7467 15.8682 16.3693 15.7012 17.1659C15.6498 17.411 15.4336 17.5865 15.1832 17.5865C14.9327 17.5865 14.7166 17.411 14.6652 17.1659C14.4982 16.3693 13.8757 15.7467 13.0791 15.5797C12.834 15.5283 12.6584 15.3122 12.6584 15.0617C12.6584 14.8113 12.834 14.5951 13.0791 14.5437C13.8757 14.3768 14.4983 13.7542 14.6653 12.9576C14.7167 12.7125 14.9328 12.537 15.1833 12.537C15.4337 12.537 15.6499 12.7125 15.7012 12.9576ZM12.8875 8.04183L3.95484 16.9745C3.85556 17.0738 3.7998 17.2083 3.7998 17.3487C3.7998 17.4891 3.85556 17.6237 3.95484 17.7229L5.50189 19.27C5.60525 19.3733 5.74067 19.425 5.87609 19.425C6.01151 19.425 6.14701 19.3734 6.25029 19.27L15.183 10.3373L12.8875 8.04183ZM15.8464 5.8314L17.3935 7.37845C17.4927 7.47773 17.5485 7.61234 17.5484 7.75269C17.5484 7.89303 17.4926 8.02764 17.3934 8.12689L15.9313 9.58896L13.6359 7.29348L15.0979 5.8314C15.3046 5.62472 15.6397 5.62472 15.8464 5.8314Z" fill="#F0F6F3"/>
              </svg>
              <span className="text-xs text-white/70">Улучшение<br/>фото</span>
            </button>
            
            {/* Background Creation tool - removed border for selected tool */}
            <button 
              disabled
              className="flex flex-col items-center min-w-[80px] pt-2 pb-1 opacity-50 cursor-not-allowed relative"
            >
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-5 h-5 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 4.5V6.75H13.5V4.5H15.75V19.5H8.25V4.5H10.5ZM6.75 3C6.33579 3 6 3.33579 6 3.75V20.25C6 20.6642 6.33579 21 6.75 21H17.25C17.6642 21 18 20.6642 18 20.25V3.75C18 3.33579 17.6642 3 17.25 3H6.75Z" fill="#F0F6F3"/>
                </svg>
              </div>
              <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1">
                <path d="M4.77391 6.91132C4.66687 6.80426 4.60675 6.65907 4.60675 6.50768C4.60675 6.35629 4.66687 6.2111 4.77391 6.10403L6.70364 4.1743C6.81132 4.0703 6.95554 4.01275 7.10523 4.01405C7.25493 4.01535 7.39812 4.0754 7.50398 4.18125C7.60983 4.28711 7.66988 4.4303 7.67118 4.58C7.67248 4.72969 7.61493 4.87391 7.51093 4.98159L5.5812 6.91132C5.47413 7.01836 5.32894 7.07848 5.17755 7.07848C5.02616 7.07848 4.88097 7.01836 4.77391 6.91132ZM5.17755 10.2986C5.32896 10.2986 5.47415 10.2384 5.5812 10.1314L10.731 4.98159C10.835 4.87391 10.8925 4.72969 10.8912 4.58C10.8899 4.4303 10.8299 4.28711 10.724 4.18125C10.6182 4.0754 10.475 4.01535 10.3253 4.01405C10.1756 4.01275 10.0314 4.0703 9.92367 4.1743L4.77391 9.32406C4.69409 9.40391 4.63973 9.50563 4.61771 9.61636C4.59569 9.72709 4.607 9.84187 4.6502 9.94618C4.6934 10.0505 4.76656 10.1396 4.86043 10.2024C4.95429 10.2651 5.06465 10.2986 5.17755 10.2986ZM5.17755 13.5301C5.32896 13.5301 5.47415 13.4699 5.5812 13.3628L13.9624 4.98159C14.0169 4.92892 14.0604 4.86592 14.0904 4.79627C14.1203 4.72661 14.136 4.6517 14.1367 4.57589C14.1373 4.50008 14.1229 4.4249 14.0942 4.35474C14.0655 4.28457 14.0231 4.22083 13.9695 4.16722C13.9159 4.11361 13.8521 4.07122 13.782 4.04252C13.7118 4.01381 13.6366 3.99936 13.5608 4.00002C13.485 4.00068 13.4101 4.01643 13.3404 4.04635C13.2708 4.07627 13.2078 4.11977 13.1551 4.1743L4.77391 12.5555C4.69409 12.6354 4.63973 12.7371 4.61771 12.8478C4.59569 12.9585 4.607 13.0733 4.6502 13.1776C4.6934 13.2819 4.76656 13.3711 4.86043 13.4338C4.95429 13.4966 5.06465 13.5301 5.17755 13.5301ZM5.17755 16.7615C5.32896 16.7615 5.47415 16.7013 5.5812 16.5943L17.1939 4.98159C17.2484 4.92892 17.2919 4.86592 17.3218 4.79627C17.3517 4.72661 17.3675 4.6517 17.3681 4.57589C17.3688 4.50008 17.3544 4.4249 17.3256 4.35474C17.2969 4.28457 17.2545 4.22083 17.2009 4.16722C17.1473 4.11361 17.0836 4.07122 17.0134 4.04252C16.9433 4.01381 16.8681 3.99936 16.7923 4.00002C16.7165 4.00068 16.6415 4.01643 16.5719 4.04635C16.5022 4.07627 16.4392 4.11977 16.3866 4.1743L4.77391 15.787C4.69409 15.8668 4.63973 15.9685 4.61771 16.0793C4.59569 16.19 4.607 16.3048 4.6502 16.4091C4.6934 16.5134 4.76656 16.6025 4.86043 16.6653C4.95429 16.728 5.06465 16.7615 5.17755 16.7615ZM20.4253 4.1743C20.3182 4.06727 20.1731 4.00714 20.0217 4.00714C19.8703 4.00714 19.7251 4.06727 19.618 4.1743L4.77391 19.0184C4.71938 19.0711 4.67588 19.1341 4.64596 19.2037C4.61604 19.2734 4.60029 19.3483 4.59963 19.4241C4.59897 19.4999 4.61342 19.5751 4.64212 19.6453C4.67083 19.7154 4.71322 19.7792 4.76683 19.8328C4.82044 19.8864 4.88418 19.9288 4.95435 19.9575C5.02451 19.9862 5.09969 20.0006 5.1755 20C5.25131 19.9993 5.32622 19.9836 5.39588 19.9536C5.46553 19.9237 5.52853 19.8802 5.5812 19.8257L20.4253 4.98159C20.5323 4.87452 20.5925 4.72933 20.5925 4.57794C20.5925 4.42655 20.5323 4.28136 20.4253 4.1743ZM19.618 7.40575L8.00536 19.0184C7.95083 19.0711 7.90733 19.1341 7.87741 19.2037C7.84749 19.2734 7.83174 19.3483 7.83108 19.4241C7.83042 19.4999 7.84487 19.5751 7.87357 19.6453C7.90228 19.7154 7.94467 19.7792 7.99828 19.8328C8.05189 19.8864 8.11563 19.9288 8.1858 19.9575C8.25596 19.9862 8.33114 20.0006 8.40695 20C8.48275 19.9993 8.55767 19.9836 8.62733 19.9536C8.69698 19.9237 8.75998 19.8802 8.81265 19.8257L20.4253 8.21304C20.4798 8.16037 20.5233 8.09737 20.5533 8.02772C20.5832 7.95806 20.5989 7.88315 20.5996 7.80734C20.6002 7.73153 20.5858 7.65635 20.5571 7.58619C20.5284 7.51602 20.486 7.45228 20.4324 7.39867C20.3788 7.34506 20.315 7.30267 20.2449 7.27396C20.1747 7.24526 20.0995 7.23081 20.0237 7.23147C19.9479 7.23213 19.873 7.24788 19.8033 7.2778C19.7337 7.30772 19.6707 7.35122 19.618 7.40575ZM19.618 10.6372L11.2368 19.0184C11.1823 19.0711 11.1388 19.1341 11.1089 19.2037C11.0789 19.2734 11.0632 19.3483 11.0625 19.4241C11.0619 19.4999 11.0763 19.5751 11.105 19.6453C11.1337 19.7154 11.1761 19.7792 11.2297 19.8328C11.2833 19.8864 11.3471 19.9288 11.4172 19.9575C11.4874 19.9862 11.5626 20.0006 11.6384 20C11.7142 19.9993 11.7891 19.9836 11.8588 19.9536C11.9284 19.9237 11.9914 19.8802 12.0441 19.8257L20.4253 11.4445C20.5293 11.3368 20.5869 11.1926 20.5856 11.0429C20.5843 10.8932 20.5242 10.75 20.4184 10.6442C20.3125 10.5383 20.1693 10.4783 20.0196 10.477C19.8699 10.4757 19.7257 10.5332 19.618 10.6372ZM19.618 13.8686L14.4683 19.0184C14.3612 19.1255 14.3011 19.2708 14.3011 19.4223C14.3012 19.5737 14.3614 19.7189 14.4685 19.826C14.5757 19.933 14.7209 19.9932 14.8724 19.9931C15.0238 19.993 15.1691 19.9328 15.2761 19.8257L20.4253 14.6765C20.4784 14.6235 20.5204 14.5606 20.5492 14.4913C20.5779 14.422 20.5927 14.3478 20.5927 14.2728C20.5927 14.1978 20.578 14.1235 20.5493 14.0542C20.5206 13.9849 20.4786 13.922 20.4256 13.8689C20.3726 13.8159 20.3097 13.7738 20.2404 13.7451C20.1711 13.7164 20.0969 13.7016 20.0219 13.7015C19.9469 13.7015 19.8726 13.7163 19.8033 13.7449C19.734 13.7736 19.6711 13.8156 19.618 13.8686ZM19.618 17.0887L17.6883 19.0184C17.6338 19.0711 17.5903 19.1341 17.5603 19.2037C17.5304 19.2734 17.5147 19.3483 17.514 19.4241C17.5134 19.4999 17.5278 19.5751 17.5565 19.6453C17.5852 19.7154 17.6276 19.7792 17.6812 19.8328C17.7348 19.8864 17.7986 19.9288 17.8687 19.9575C17.9389 19.9862 18.0141 20.0006 18.0899 20C18.1657 19.9993 18.2406 19.9836 18.3103 19.9536C18.3799 19.9237 18.4429 19.8802 18.4956 19.8257L20.4253 17.896C20.5293 17.7883 20.5869 17.6441 20.5856 17.4944C20.5843 17.3447 20.5242 17.2015 20.4184 17.0956C20.3125 16.9898 20.1693 16.9297 20.0196 16.9284C19.8699 16.9271 19.7257 16.9847 19.618 17.0887Z" fill={activeTool === 'background' ? 'url(#gradient-background)' : '#F0F6F3'}/>
                <defs>
                  <linearGradient id="gradient-background" x1="4.59961" y1="12" x2="20.5996" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#58E877"/>
                    <stop offset="1" stopColor="#FFFBA1"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className={`text-xs ${activeTool === 'background' ? 'text-white' : 'text-white/70'}`}>Создание<br/>фона</span>
            </button>
            {/* Object Removal tool - disabled */}
            <button 
              disabled
              className="flex flex-col items-center min-w-[80px] pt-2 pb-1 opacity-50 cursor-not-allowed relative"
            >
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-5 h-5 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 4.5V6.75H13.5V4.5H15.75V19.5H8.25V4.5H10.5ZM6.75 3C6.33579 3 6 3.33579 6 3.75V20.25C6 20.6642 6.33579 21 6.75 21H17.25C17.6642 21 18 20.6642 18 20.25V3.75C18 3.33579 17.6642 3 17.25 3H6.75Z" fill="#F0F6F3"/>
                </svg>
              </div>
              <svg width="24" height="24" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1">
                <g clipPath="url(#clip0_1515_5120)">
                  <path d="M15.6731 13.8185H10.1562L3.30948 6.9718L0.613433 9.66785C0.477094 9.80424 0.400391 9.98926 0.400391 10.1821C0.400391 10.375 0.477094 10.56 0.613433 10.6964L4.97707 15.06C5.11346 15.1964 5.29838 15.273 5.4913 15.273H8.40039C8.40058 15.273 8.40068 15.273 8.40083 15.273H15.6731C16.0748 15.273 16.4004 14.9474 16.4004 14.5458C16.4004 14.1441 16.0748 13.8185 15.6731 13.8185Z" fill="#F0F6F3"/>
                  <path d="M10.3691 0.940319C10.0851 0.656295 9.62458 0.656295 9.34056 0.940271L4.33789 5.94303L11.1846 12.7897L16.1873 7.78701C16.4713 7.50303 16.4713 7.04253 16.1873 6.7585L10.3691 0.940319Z" fill="#F0F6F3"/>
                </g>
                <defs>
                  <clipPath id="clip0_1515_5120">
                    <rect width="16" height="16" fill="white" transform="translate(0.400391)"/>
                  </clipPath>
                </defs>
              </svg>
              <span className="text-xs text-white/70">Удаление<br/>объекта</span>
            </button>
            {/* Face Modification tool - disabled */}
            <button 
              disabled
              className="flex flex-col items-center min-w-[80px] pt-2 pb-1 opacity-50 cursor-not-allowed relative"
            >
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-5 h-5 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 4.5V6.75H13.5V4.5H15.75V19.5H8.25V4.5H10.5ZM6.75 3C6.33579 3 6 3.33579 6 3.75V20.25C6 20.6642 6.33579 21 6.75 21H17.25C17.6642 21 18 20.6642 18 20.25V3.75C18 3.33579 17.6642 3 17.25 3H6.75Z" fill="#F0F6F3"/>
                </svg>
              </div>
              <svg width="25" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1">
                <path d="M15.4498 8.83337C15.4498 10.6743 13.9574 12.1666 12.1165 12.1666C10.2755 12.1666 8.7832 10.6743 8.7832 8.83337C8.7832 6.99243 10.2755 5.5 12.1165 5.5C13.9574 5.5 15.4498 6.99243 15.4498 8.83337Z" fill="#F0F6F3"/>
                <path d="M6.61719 19.5H17.6172C17.8932 19.5 18.1172 19.276 18.1172 19V16.6666C18.1172 14.9207 16.6965 13.5 14.9506 13.5H9.28394C7.53784 13.5 6.11719 14.9207 6.11719 16.6666V19C6.11719 19.276 6.34119 19.5 6.61719 19.5Z" fill="#F0F6F3"/>
                <path d="M5.4502 5.5V6.66663C5.4502 7.03528 5.7489 7.33337 6.11682 7.33337C6.48486 7.33337 6.78357 7.03528 6.78357 6.66663V5.5C6.78357 5.13196 7.08289 4.83337 7.4502 4.83337H8.4502C8.81824 4.83337 9.11682 4.53528 9.11682 4.16663C9.11682 3.79797 8.81824 3.5 8.4502 3.5H7.4502C6.34753 3.5 5.4502 4.39734 5.4502 5.5Z" fill="#F0F6F3"/>
                <path d="M7.4502 12.8334H8.4502C8.81824 12.8334 9.11682 12.5353 9.11682 12.1666C9.11682 11.798 8.81824 11.5 8.4502 11.5H7.4502C7.08289 11.5 6.78357 11.2013 6.78357 10.8334V9.66663C6.78357 9.29797 6.48486 9 6.11682 9C5.7489 9 5.4502 9.29797 5.4502 9.66663V10.8334C5.4502 11.936 6.34753 12.8334 7.4502 12.8334Z" fill="#F0F6F3"/>
                <path d="M18.7839 5.5C18.7839 4.39734 17.8866 3.5 16.7839 3.5H15.7839C15.4159 3.5 15.1172 3.79797 15.1172 4.16663C15.1172 4.53528 15.4159 4.83337 15.7839 4.83337H16.7839C17.1512 4.83337 17.4506 5.13196 17.4506 5.5V6.66663C17.4506 7.03528 17.7493 7.33337 18.1172 7.33337C18.4852 7.33337 18.7839 7.03528 18.7839 6.66663V5.5Z" fill="#F0F6F3"/>
                <path d="M18.7839 10.8334V9.66663C18.7839 9.29797 18.4852 9 18.1172 9C17.7493 9 17.4506 9.29797 17.4506 9.66663V10.8334C17.4506 11.2013 17.1512 11.5 16.7839 11.5H15.7839C15.4159 11.5 15.1172 11.798 15.1172 12.1666C15.1172 12.5353 15.4159 12.8334 15.7839 12.8334H16.7839C17.8866 12.8334 18.7839 11.936 18.7839 10.8334Z" fill="#F0F6F3"/>
              </svg>
              <span className="text-xs text-white/70">Изменение<br/>лиц</span>
            </button>
             {/* Photo Styles tool - disabled */}
            <button 
              disabled
              className="flex flex-col items-center min-w-[80px] pt-2 pb-1 opacity-50 cursor-not-allowed relative"
            >
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-5 h-5 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 4.5V6.75H13.5V4.5H15.75V19.5H8.25V4.5H10.5ZM6.75 3C6.33579 3 6 3.33579 6 3.75V20.25C6 20.6642 6.33579 21 6.75 21H17.25C17.6642 21 18 20.6642 18 20.25V3.75C18 3.33579 17.6642 3 17.25 3H6.75Z" fill="#F0F6F3"/>
                </svg>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.7691 4H4.61544C4.2755 4 4 4.2755 4 4.61544V10.7691C4 11.1091 4.2755 11.3846 4.61544 11.3846H10.7691C11.1091 11.3846 11.3846 11.1091 11.3846 10.7691V4.61544C11.3846 4.2755 11.1091 4 10.7691 4ZM19.3846 4H13.2309C12.8909 4 12.6154 4.2755 12.6154 4.61544V10.7691C12.6154 11.1091 12.8909 11.3846 13.2309 11.3846H19.3846C19.7245 11.3846 20 11.1091 20 10.7691V4.61544C20 4.2755 19.7245 4 19.3846 4ZM18.7691 10.1537H13.8463V5.23087H18.7691V10.1537ZM4.61544 12.6154H10.7691C11.1091 12.6154 11.3846 12.8903 11.3846 13.2309V19.3846C11.3846 19.7245 11.1091 20 10.7691 20H4.61544C4.2755 20 4 19.7245 4 19.3846V13.2309C4 12.8909 4.2755 12.6154 4.61544 12.6154ZM7.07718 18.1537C7.07718 18.3792 7.01208 18.5877 6.90622 18.7691H8.47834C8.37248 18.5877 8.30739 18.3792 8.30739 18.1537C8.30739 17.4738 8.85839 16.9228 9.53826 16.9228C9.76379 16.9228 9.97222 16.9879 10.1537 17.0938V15.5217C9.97222 15.6275 9.76379 15.6926 9.53826 15.6926C8.85839 15.6926 8.30739 15.1416 8.30739 14.4617C8.30739 14.2362 8.37248 14.0278 8.47834 13.8463H6.90622C7.01208 14.0278 7.07718 14.2362 7.07718 14.4617C7.07718 15.1416 6.52618 15.6926 5.84631 15.6926C5.62078 15.6926 5.41234 15.6275 5.23087 15.5217V17.0938C5.41234 16.9879 5.62078 16.9228 5.84631 16.9228C6.52618 16.9228 7.07718 17.4738 7.07718 18.1537ZM19.3846 12.6154H13.2309C12.8909 12.6154 12.6154 12.8909 12.6154 13.2309V16.3074V19.3839C12.6154 19.7238 12.8909 19.9993 13.2309 19.9993H16.3074H19.3839C19.7238 19.9993 19.9993 19.7238 19.9993 19.3839V13.2302C20 12.8903 19.7245 12.6154 19.3846 12.6154ZM13.8463 16.5625L16.5625 13.8463H17.8992L13.8463 17.8992V16.5625ZM13.8463 13.8463H14.8221L13.8463 14.8221V13.8463ZM18.7691 14.7162V16.0523L16.0529 18.7691H14.7162L18.7691 14.7162ZM18.7691 18.7691H17.7927L18.7691 17.7927V18.7691ZM8.92348 16.3074C8.92348 16.9872 8.3724 17.5383 7.69261 17.5383C7.01282 17.5383 6.46174 16.9872 6.46174 16.3074C6.46174 15.6276 7.01282 15.0765 7.69261 15.0765C8.3724 15.0765 8.92348 15.6276 8.92348 16.3074Z" fill="#F0F6F3"/>
              </svg>
              <span className="text-xs text-white/70">Стили для<br/>фото</span>
            </button>
          </div>
        </div>
      </footer>
      
      {/* CSS for gradient text and other styling */}
      <style jsx>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}