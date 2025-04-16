"use client";
import { Suspense, useState, useEffect } from 'react';
import ThreeDsCallbackContent from '@/components/ThreeDsCallbackContent';

// Определяем типы
interface ThreeDsFormData {
  paRes: string | null;
  md: string | null;
}

export default function ThreeDsCallbackPage() {
  const [formData, setFormData] = useState<ThreeDsFormData | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing');
  
  // Извлекаем и логируем все возможные источники данных
  useEffect(() => {
    console.log('3DS callback страница загружена');
    console.log('URL search params:', window.location.search);
    
    // Первым приоритетом извлекаем POST данные с помощью скрытой формы
    const extractPostData = () => {
      // Создаем временный элемент для захвата POST данных
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);
      
      // Используем XMLHttpRequest для захвата POST данных с текущего URL
      const xhr = new XMLHttpRequest();
      xhr.open('POST', window.location.href, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          try {
            // Получаем данные запроса
            const params = new URLSearchParams(xhr.responseText);
            const postData: ThreeDsFormData = {
              paRes: params.get('PaRes') || params.get('pares') || params.get('PARes') || null,
              md: params.get('MD') || params.get('md') || null
            };
            
            if (postData.paRes && postData.md) {
              console.log('Найдены POST данные:', postData);
              setFormData(postData);
              sendDataToParent(postData);
            }
          } catch (e) {
            console.error('Ошибка при извлечении POST данных:', e);
          }
          // Удаляем временный элемент
          document.body.removeChild(tempDiv);
        }
      };
      xhr.send();
    };
    
    // Пытаемся извлечь POST данные
    try {
      extractPostData();
    } catch (e) {
      console.warn('Не удалось извлечь POST данные напрямую:', e);
    }
    
    // Проверяем параметры в URL (GET или после преобразования POST в GET)
    const urlParams = new URLSearchParams(window.location.search);
    const urlData: ThreeDsFormData = {
      paRes: urlParams.get('PaRes') || urlParams.get('pares') || urlParams.get('PARes') || null,
      md: urlParams.get('MD') || urlParams.get('md') || null
    };
    
    if (urlData.paRes && urlData.md) {
      console.log('Найдены данные в URL параметрах:', urlData);
      setFormData(urlData);
      sendDataToParent(urlData);
    }
    
    // Проверяем наличие POST формы на странице
    setTimeout(() => {
      const forms = document.forms;
      if (forms.length > 0) {
        console.log('Найдены формы:', forms.length);
        
        // Проходим по всем формам
        Array.from(forms).forEach((form, index) => {
          const paResInput = form.querySelector('input[name="PaRes"], input[name="pares"], input[name="PARes"]') as HTMLInputElement;
          const mdInput = form.querySelector('input[name="MD"], input[name="md"]') as HTMLInputElement;
          
          if (paResInput && mdInput) {
            const formPostData = {
              paRes: paResInput.value,
              md: mdInput.value
            };
            console.log(`Найдены данные в форме ${index}:`, formPostData);
            setFormData(formPostData);
            sendDataToParent(formPostData);
          }
        });
      }
    }, 500);
    
    // Прямой анализ POST данных через перехват события submit
    const handleSubmit = function(event: Event) {
      const submitEvent = event as SubmitEvent;
      submitEvent.preventDefault();
      
      const form = submitEvent.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const capturedData: ThreeDsFormData = {
        paRes: (formData.get('PaRes') || formData.get('pares') || formData.get('PARes')) as string || null,
        md: (formData.get('MD') || formData.get('md')) as string || null
      };
      
      if (capturedData.paRes && capturedData.md) {
        console.log('Перехвачены данные из формы submit:', capturedData);
        setFormData(capturedData);
        sendDataToParent(capturedData);
      }
      
      return false;
    };
    
    // Добавляем обработчик для всех форм - теперь без приведения типов
    document.addEventListener('submit', handleSubmit);
    
    // Удаляем обработчик при размонтировании
    return () => {
      document.removeEventListener('submit', handleSubmit);
    };
  }, []);
  
  // Функция отправки данных в родительское окно
  const sendDataToParent = (data: ThreeDsFormData) => {
    if (!data.paRes || !data.md) {
      console.error('Отсутствуют необходимые данные для отправки');
      setProcessingStatus('error');
      return;
    }
    
    console.log('Попытка отправки данных родительскому окну:', data);
    let messageSent = false;
    
    try {
      // Способ 1: через window.opener (если страница открыта в новом окне)
      if (window.opener) {
        console.log('Отправка через window.opener');
        window.opener.postMessage({paRes: data.paRes, transactionId: data.md}, '*');
        messageSent = true;
      }
      // Способ 2: через родительское окно (если это iframe)
      else if (window.parent && window.parent !== window) {
        console.log('Отправка через window.parent');
        window.parent.postMessage({paRes: data.paRes, transactionId: data.md}, '*');
        messageSent = true;
      }
      
      // Способ 3: через localStorage (запасной вариант)
      try {
        localStorage.setItem('3ds_result', JSON.stringify({
          paRes: data.paRes,
          transactionId: data.md,
          timestamp: Date.now()
        }));
        console.log('Данные сохранены в localStorage');
        messageSent = true;
      } catch (e) {
        console.warn('Не удалось использовать localStorage:', e);
      }
      
      if (messageSent) {
        console.log('Данные успешно отправлены');
        setProcessingStatus('success');
        
        // Если это отдельное окно, закрываем его через некоторое время
        if (window.opener) {
          setTimeout(() => {
            console.log('Закрытие окна 3DS');
            window.close();
          }, 2000);
        }
      } else {
        console.error('Не удалось отправить данные - нет доступного метода');
        setProcessingStatus('error');
      }
    } catch (e) {
      console.error('Ошибка при отправке данных:', e);
      setProcessingStatus('error');
    }
  };
  
  // Создаем скрытую форму для ручного перехвата POST данных
  useEffect(() => {
    if (processingStatus !== 'processing') return;
    
    // Создаем скрытую форму, которая будет перехватывать POST данные
    const hiddenForm = document.createElement('form');
    hiddenForm.id = 'postDataCatcher';
    hiddenForm.method = 'POST';
    hiddenForm.action = 'javascript:void(0)';
    hiddenForm.style.display = 'none';
    
    // Добавляем поля для всех возможных имен параметров
    ['PaRes', 'pares', 'PARes'].forEach(name => {
      const input = document.createElement('input');
      input.name = name;
      input.type = 'text';
      hiddenForm.appendChild(input);
    });
    
    ['MD', 'md'].forEach(name => {
      const input = document.createElement('input');
      input.name = name;
      input.type = 'text';
      hiddenForm.appendChild(input);
    });
    
    // Добавляем обработчик отправки формы
    hiddenForm.onsubmit = function(event) {
      event.preventDefault();
      const formData = new FormData(hiddenForm);
      
      const capturedData: ThreeDsFormData = {
        paRes: (formData.get('PaRes') || formData.get('pares') || formData.get('PARes')) as string || null,
        md: (formData.get('MD') || formData.get('md')) as string || null
      };
      
      if (capturedData.paRes && capturedData.md) {
        console.log('Перехвачены данные из скрытой формы:', capturedData);
        setFormData(capturedData);
        sendDataToParent(capturedData);
      }
      
      return false;
    };
    
    document.body.appendChild(hiddenForm);
    
    // Очищаем при размонтировании
    return () => {
      if (document.getElementById('postDataCatcher')) {
        document.body.removeChild(hiddenForm);
      }
    };
  }, [processingStatus]);
  
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-5">
      <Suspense fallback={<div className="text-xl">Загрузка...</div>}>
        <ThreeDsCallbackContent 
          formData={formData} 
          status={processingStatus} 
          onRetry={() => {
            if (formData) sendDataToParent(formData);
          }} 
        />
      </Suspense>
    </div>
  );
}