"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/services/auth.service';
import payService, { Product } from '@/services/pay.service';
import PaymentForm from '@/components/PaymentForm';

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [productId, setProductId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract product ID from URL
  useEffect(() => {
    const productIdParam = searchParams.get('productId');
    if (productIdParam) {
      setProductId(productIdParam);
    }
    
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
  }, [searchParams, router]);

  // Fetch product details if we have a product ID
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const products = await payService.getProducts();
        const foundProduct = products.find(p => p.product_id === productId);
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError('Запрошенный тариф не найден');
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Не удалось загрузить информацию о тарифе');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Handle payment success
  const handlePaymentSuccess = () => {
    // Refresh user subscription status and redirect
    authService.refreshUserData();
    router.push('/profile');
  };

  // Handle payment error
  const handlePaymentError = (err: any) => {
    console.error('Payment error:', err);
    // Error is handled by the PaymentForm component
  };

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
              <path d="M16.1252 20.9999C15.9332 20.9999 15.7412 20.9264 15.5949 20.7802L7.34494 12.5302C7.05169 12.2369 7.05169 11.7629 7.34494 11.4697L15.5949 3.21969C15.8882 2.92644 16.3622 2.92644 16.6554 3.21969C16.9487 3.51294 16.9487 3.98694 16.6554 4.28019L8.93569 11.9999L16.6554 19.7197C16.9487 20.0129 16.9487 20.4869 16.6554 20.7802C16.5092 20.9264 16.3172 20.9999 16.1252 20.9999Z" fill="#F0F6F3"/>
            </svg>
          </button>
        </div>
        
        <div>
          <h1 className="text-xl font-medium">Оплата PRO доступа</h1>
        </div>
        
        <div className="w-6">
          {/* Empty div for alignment */}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto p-4 md:p-6 mt-4 md:mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="mt-4 text-white/70">Загрузка...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-6 py-4 rounded-lg text-center">
            <p className="font-medium mb-2">Ошибка</p>
            <p>{error}</p>
            <button
              onClick={() => router.push('/profile')}
              className="mt-4 px-5 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Вернуться в профиль
            </button>
          </div>
        ) : !productId ? (
          <div className="bg-[#151515] rounded-xl p-6 text-center">
            <p className="text-white/70 mb-4">Не выбран тарифный план</p>
            <button
              onClick={() => router.push('/profile')}
              className="px-5 py-2 bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium rounded-lg"
            >
              Выбрать тариф
            </button>
          </div>
        ) : (
          <div className="bg-[#151515] rounded-xl p-4">
            <PaymentForm 
              productId={Number(productId)} 
              onClose={() => router.push('/profile')} 
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        )}
      </main>
    </div>
  );
}
