"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Определяем типы
interface ThreeDsFormData {
  paRes: string | null;
  md: string | null;
}

interface ThreeDsCallbackContentProps {
  formData?: ThreeDsFormData | null;
  status?: 'processing' | 'success' | 'error';
  onRetry?: () => void;
}

export default function ThreeDsCallbackContent({ 
  formData, 
  status = 'processing',
  onRetry 
}: ThreeDsCallbackContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [dataFound, setDataFound] = useState(false);
  
  // Обратный отсчет для автоматического перехода
  useEffect(() => {
    if (status !== 'success' && status !== 'error') return;
    
    let redirectTimeout: NodeJS.Timeout;
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Перенаправление на страницу профиля
          if (status === 'success' || window.opener) {
            redirectTimeout = setTimeout(() => {
              if (!window.opener) {
                router.push('/profile');
              }
            }, 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimeout);
    };
  }, [status, router]);
  
  // Пытаемся получить параметры из URL, POST данных или других источников
  useEffect(() => {
    if (dataFound || !window) return;
    
    const checkForData = () => {
      // Проверяем уже полученные данные от родительской страницы
      if (formData?.paRes && formData?.md) {
        console.log('Используются данные из props:', { paRes: 'найден', md: formData.md });
        sendDataToParent(formData.paRes, formData.md);
        return true;
      }
      
      // Проверяем параметры URL
      if (searchParams) {
        const paRes = 
          searchParams.get('PaRes') || 
          searchParams.get('pares') || 
          searchParams.get('PARes') || 
          null;
        
        const md = 
          searchParams.get('MD') || 
          searchParams.get('md') || 
          null;
        
        if (paRes && md) {
          console.log('ThreeDsCallbackContent: Обнаружены параметры в URL:', { paRes: 'найден', md });
          sendDataToParent(paRes, md);
          return true;
        }
      }
      
      // Проверяем форму на наличие hidden полей
      const forms = document.forms;
      if (forms && forms.length > 0) {
        for (let i = 0; i < forms.length; i++) {
          const form = forms[i];
          const paResInput = form.querySelector('input[name="PaRes"], input[name="pares"], input[name="PARes"]') as HTMLInputElement;
          const mdInput = form.querySelector('input[name="MD"], input[name="md"]') as HTMLInputElement;
          
          if (paResInput?.value && mdInput?.value) {
            console.log(`Обнаружены данные в форме ${i}:`, { paRes: 'найден', md: mdInput.value });
            sendDataToParent(paResInput.value, mdInput.value);
            return true;
          }
        }
      }
      
      return false;
    };
    
    // Выполняем проверку и запоминаем результат
    const found = checkForData();
    if (found) {
      setDataFound(true);
    }
    
    // Повторяем проверку через некоторое время
    if (!found) {
      const timeout = setTimeout(() => {
        const retryFound = checkForData();
        if (retryFound) {
          setDataFound(true);
        }
      }, 800);
      
      return () => clearTimeout(timeout);
    }
  }, [formData, searchParams, dataFound]);
  
  // Функция отправки данных в родительское окно
  const sendDataToParent = (paRes: string, md: string) => {
    try {
      const message = { 
        paRes, 
        transactionId: md,  // Используем поле transactionId для совместимости
        md                  // Сохраняем также оригинальное поле md
      };
      
      // Попытка 1: window.opener (если открыто в новом окне)
      if (window.opener) {
        window.opener.postMessage(message, '*');
        console.log('Отправлено сообщение через window.opener');
      } 
      // Попытка 2: window.parent (если это iframe)
      else if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
        console.log('Отправлено сообщение через window.parent');
      }
      
      // Попытка 3: localStorage (для надежности)
      localStorage.setItem('3ds_result', JSON.stringify({
        ...message,
        timestamp: Date.now()
      }));
      console.log('Сохранено в localStorage с временной меткой');
    } catch (e) {
      console.error('Ошибка при отправке данных:', e);
    }
  };
  
  return (
    <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-4 text-center">Подтверждение платежа</h1>
      
      {status === 'success' && (
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p className="text-green-400 text-lg mt-4">Верификация успешно завершена!</p>
          
          {window.opener ? (
            <p className="text-gray-400 mt-2">Это окно закроется автоматически...</p>
          ) : (
            <p className="text-gray-400 mt-2">Перенаправление через {countdown} сек...</p>
          )}
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <p className="text-red-400 text-lg mt-4">Ошибка обработки платежа</p>
          <p className="text-gray-400 mt-2">Не удалось передать данные верификации</p>
          
          <button 
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Повторить попытку
          </button>
          
          <p className="text-gray-400 mt-4">
            Перенаправление через {countdown} сек...
          </p>
        </div>
      )}
      
      {status === 'processing' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-300 mt-4">Пожалуйста, подождите...</p>
          <p className="text-gray-400 mt-2">Обработка ответа от банка</p>
          
          {/* Скрытая форма для поддержки ручного подтверждения, если автоматическое не сработает */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg" style={{display: dataFound ? 'none' : 'block'}}>
            <p className="text-sm text-yellow-400 mb-2">Если страница не перенаправляется автоматически:</p>
            <button 
              onClick={() => {
                // Пробуем повторно обнаружить данные
                const forms = document.forms;
                if (forms.length > 0) {
                  const form = forms[0];
                  form.dispatchEvent(new Event('submit'));
                }
                
                if (onRetry) onRetry();
              }}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm"
            >
              Нажмите здесь для подтверждения
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6 w-full bg-gray-800 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${
            status === 'success' ? 'bg-green-600' : 
            status === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`} 
          style={{ width: `${(countdown/5) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}