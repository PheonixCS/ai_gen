"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function YandexCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function processAuth() {
      try {
        // Extract hash fragment from URL (remove the leading #)
        const hash = window.location.hash.substring(1);
        
        if (!hash) {
          setStatus('error');
          setErrorMsg('No authentication data received from Yandex');
          return;
        }
        
        // Parse the hash to get parameters
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (!accessToken) {
          setStatus('error');
          setErrorMsg('Access token not found in the response');
          return;
        }

        // Make request to our backend API
        const response = await fetch(`https://imageni.org/api/auth/yandex.php?access_token=${accessToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (data.code === 200) {
          // Save user data and token to localStorage with a special flag
          const userData = {
            ...data.user,
            token: data.token,
            yandexAuth: true, // Add a flag to indicate successful Yandex auth
            authTimestamp: Date.now() // Add timestamp for the main window to detect
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Notify any parent/opener window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'YANDEX_AUTH_SUCCESS' }, '*');
          }
          
          // Show success message briefly before closing
          setStatus('loading');
          document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0F0F0F;color:white;font-family:sans-serif;"><div style="text-align:center;"><div>Авторизация успешна!</div><div style="margin-top:10px;font-size:14px;">Это окно закроется через несколько секунд...</div></div></div>';
          
          // Close this window after a short delay
          setTimeout(() => {
            window.close();
            
            // If window doesn't close (e.g., it wasn't opened via JavaScript),
            // redirect back to login
            setTimeout(() => {
              router.push('/login');
            }, 500);
          }, 1500);
        } else {
          setStatus('error');
          setErrorMsg(data.msg || 'Authentication failed');
        }
      } catch (error) {
        console.error('Error during Yandex authentication:', error);
        setStatus('error');
        setErrorMsg('An error occurred during authentication');
      }
    }

    processAuth();
  }, [router]); // Add router as dependency here

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F0F0F] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58E877] mb-4"></div>
        <p>Авторизация через Яндекс...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F0F0F] text-white p-4">
      <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-6 py-4 rounded-lg max-w-md text-center mb-6">
        <h2 className="text-xl mb-2">Ошибка авторизации</h2>
        <p>{errorMsg}</p>
      </div>
      <button 
        onClick={() => router.push('/login')}
        className="px-6 py-3 bg-transparent border border-white/20 rounded hover:bg-white/10 transition-colors"
      >
        Вернуться на страницу входа
      </button>
    </div>
  );
}
