"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import payService, { CardInfo, Product } from '@/services/pay.service';
import authService from '@/services/auth.service';

interface PaymentFormProps {
  onClose?: () => void;
  productId?: number; // Optional: pre-selected product ID
  onSuccess?: () => void; // Callback for successful payment
  onError?: (error: any) => void; // Callback for payment errors
}

export default function PaymentForm({ onClose, productId, onSuccess, onError }: PaymentFormProps) {
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stage, setStage] = useState<'products' | 'payment' | 'processing' | '3ds' | 'success' | 'error'>('products');
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [threeDsData, setThreeDsData] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const router = useRouter();

  // Fetch products and user info on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get available products
        const availableProducts = await payService.getProducts();
        setProducts(availableProducts);
        
        // If productId is provided, select that product
        if (productId) {
          const preselectedProduct = availableProducts.find(p => p.id === productId);
          if (preselectedProduct) {
            setSelectedProduct(preselectedProduct);
            setStage('payment');
          }
        }

        // Get current user email
        const currentUser = authService.getCurrentUser();
        if (currentUser?.email) {
          setUserEmail(currentUser.email);
        } else {
          // Redirect to login if no user is authenticated
          router.push('/login');
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      }
    };

    fetchData();
  }, [productId, router]);

  // Format card number with spaces (e.g. 4242 4242 4242 4242)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiration date (MM/YY)
  const formatExpiryDate = (month: string, year: string) => {
    return `${month.padStart(2, '0')}/${year.padStart(2, '0')}`;
  };

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };

  // Handle expiration month input
  const handleExpMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
      setExpMonth(value);
    }
  };

  // Handle expiration year input
  const handleExpYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setExpYear(value);
  };

  // Handle CVV input
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  // Select a product and proceed to payment
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setStage('payment');
  };

  // Basic form validation
  const validateForm = () => {
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Введите корректный номер карты');
      return false;
    }
    
    if (expMonth.length < 1 || parseInt(expMonth) < 1 || parseInt(expMonth) > 12) {
      setError('Введите корректный месяц');
      return false;
    }
    
    if (expYear.length < 2) {
      setError('Введите корректный год');
      return false;
    }
    
    if (cvv.length < 3) {
      setError('Введите корректный CVV/CVC код');
      return false;
    }
    
    return true;
  };

  // Handle payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm() || !selectedProduct || !userEmail) {
      return;
    }
    
    setLoading(true);
    setStage('processing');
    
    try {
      // Prepare card info for cryptogram generation
      const cardInfo: CardInfo = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expDateMonth: expMonth.padStart(2, '0'),
        expDateYear: '20' + expYear.padStart(2, '0'),
        cvv: cvv,
        holderName: name
      };
      
      // Generate cryptogram
      const cryptogram = await payService.generateCryptogram(cardInfo);
      console.log('Cryptogram generated successfully');
      
      // Process payment with the cryptogram
      const paymentResult = await payService.processPaymentWithCryptogram(
        userEmail,
        selectedProduct.id,
        cryptogram
      );
      
      // Check if 3DS verification is needed
      if (paymentResult.requires3DS && paymentResult.model?.acsUrl && paymentResult.model?.paReq && paymentResult.model?.transactionId) {
        console.log('3DS verification required');
        
        // Save 3DS data for later verification
        setThreeDsData({
          transactionId: paymentResult.model.transactionId,
          paReq: paymentResult.model.paReq,
          acsUrl: paymentResult.model.acsUrl
        });
        
        // Build the iframe URL with the required parameters
        const termUrl = window.location.origin + '/payment/3ds-callback';
        const form = `
          <form name="downloadForm" action="${paymentResult.model.acsUrl}" method="POST">
            <input type="hidden" name="PaReq" value="${paymentResult.model.paReq}" />
            <input type="hidden" name="MD" value="${paymentResult.model.transactionId}" />
            <input type="hidden" name="TermUrl" value="${termUrl}" />
          </form>
          <script>document.downloadForm.submit();</script>
        `;
        
        // Set the iframe URL and move to 3DS stage
        const blob = new Blob([form], { type: 'text/html' });
        setIframeUrl(URL.createObjectURL(blob));
        setStage('3ds');
      } else if (paymentResult.success) {
        // Payment successful without 3DS
        console.log('Payment successful without 3DS');
        setStage('success');
        onSuccess && onSuccess();
      } else {
        // Payment failed
        console.error('Payment failed:', paymentResult.message);
        setError(paymentResult.message || 'Ошибка при обработке платежа');
        setStage('error');
        onError && onError(paymentResult);
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Произошла ошибка при обработке платежа');
      setStage('error');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle 3DS callback from iframe
  const handle3DSCallback = async (paRes: string) => {
    if (!threeDsData || !userEmail) return;
    
    setLoading(true);
    
    try {
      const result = await payService.process3DSVerification({
        transactionId: threeDsData.transactionId,
        paRes: paRes,
        appId: 'imageni.org'
      });
      
      if (result.success) {
        // 3DS verification successful
        setStage('success');
        onSuccess && onSuccess();
      } else {
        // 3DS verification failed
        setError(result.message || 'Ошибка при 3DS верификации');
        setStage('error');
        onError && onError(result);
      }
    } catch (err: any) {
      console.error('3DS verification error:', err);
      setError(err.message || 'Произошла ошибка при 3DS верификации');
      setStage('error');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for 3DS callback messages from the iframe
  useEffect(() => {
    if (stage !== '3ds') return;
    
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data && event.data.paRes) {
        handle3DSCallback(event.data.paRes);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [stage, threeDsData, userEmail]);

  // Render products selection view
  const renderProductsView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Выберите тариф</h3>
      
      <div className="grid gap-3">
        {products.map(product => (
          <div 
            key={product.id}
            className="border border-white/10 hover:border-white/30 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={() => handleProductSelect(product)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-white">{product.description}</h4>
                <p className="text-xs text-white/60">
                  {product.period} {product.internal === 'day' ? 'дней' : product.internal === 'week' ? 'недель' : 'месяцев'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  {product.has_trial ? 
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]">1 ₽</span> : 
                    `${product.amount} ₽`
                  }
                </p>
                {product.has_trial && (
                  <p className="text-xs text-white/60">Пробный период</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-white/70 hover:text-white transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  );

  // Render payment form view
  const renderPaymentForm = () => (
    <div>
      <h3 className="text-lg font-medium text-white mb-2">Оплата</h3>
      
      {selectedProduct && (
        <div className="bg-[#1A1A1A] p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-white/80">{selectedProduct.description}</p>
              <p className="text-xs text-white/60">
                {selectedProduct.period} {selectedProduct.internal === 'day' ? 'дней' : selectedProduct.internal === 'week' ? 'недель' : 'месяцев'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">
                {selectedProduct.has_trial ? 
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#58E877] to-[#FFFBA1]">1 ₽</span> : 
                  `${selectedProduct.amount} ₽`
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label htmlFor="cardNumber" className="block text-sm text-white/70 mb-1">
            Номер карты
          </label>
          <input
            id="cardNumber"
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
            required
          />
        </div>
        
        {/* Expiry Date and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Срок действия
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={expMonth}
                onChange={handleExpMonthChange}
                placeholder="MM"
                maxLength={2}
                className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
              <span className="flex items-center text-white/50">/</span>
              <input
                type="text"
                value={expYear}
                onChange={handleExpYearChange}
                placeholder="YY"
                maxLength={2}
                className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="cvv" className="block text-sm text-white/70 mb-1">
              CVV/CVC код
            </label>
            <input
              id="cvv"
              type="text"
              value={cvv}
              onChange={handleCvvChange}
              placeholder="000"
              maxLength={4}
              className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
              required
            />
          </div>
        </div>
        
        {/* Cardholder Name (optional) */}
        <div>
          <label htmlFor="name" className="block text-sm text-white/70 mb-1">
            Имя владельца карты (необязательно)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="IVAN IVANOV"
            className="w-full h-[42px] bg-[#151515] rounded-lg border border-white/8 text-white px-4 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setStage('products')}
            className="h-[48px] rounded-lg border border-white/10 text-white font-medium flex items-center justify-center transition-colors hover:border-white/30"
          >
            Назад
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Обработка..." : "Оплатить"}
          </button>
        </div>
        
        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-white/70 text-xs">
          <svg width="16" height="16" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.72">
              <path d="M18.875 9.75H17.75V8.24999C17.75 5.35512 15.3949 3 12.5 3C9.60509 3 7.25001 5.35512 7.25001 8.24999V9.75H6.12501C5.91773 9.75 5.75 9.91773 5.75 10.125V19.5C5.75 20.3273 6.42271 21 7.25001 21H17.75C18.5773 21 19.25 20.3273 19.25 19.5V10.125C19.25 9.91773 19.0823 9.75 18.875 9.75ZM13.6228 17.5836C13.6345 17.6894 13.6005 17.7956 13.5294 17.8751C13.4584 17.9546 13.3566 18 13.25 18H11.75C11.6435 18 11.5416 17.9546 11.4706 17.8751C11.3995 17.7957 11.3655 17.6895 11.3772 17.5836L11.6138 15.4563C11.2296 15.1769 11 14.7349 11 14.25C11 13.4227 11.6727 12.75 12.5 12.75C13.3273 12.75 14 13.4227 14 14.25C14 14.7349 13.7704 15.1769 13.3863 15.4563L13.6228 17.5836ZM15.5 9.75H9.50001V8.24999C9.50001 6.59582 10.8458 5.25 12.5 5.25C14.1542 5.25 15.5 6.59582 15.5 8.24999V9.75Z" fill="currentColor"/>
            </g>
          </svg>
          <span>Ваши данные защищены</span>
        </div>
      </form>
    </div>
  );

  // Render 3DS verification iframe
  const render3DSVerification = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Подтверждение платежа</h3>
      
      <p className="text-sm text-white/70 mb-4">
        Для завершения платежа, пожалуйста, пройдите проверку 3D Secure в форме ниже.
      </p>
      
      {iframeUrl && (
        <iframe 
          src={iframeUrl}
          className="w-full h-[400px] border border-white/10 rounded-lg"
          title="3D Secure Verification"
        ></iframe>
      )}
      
      <div className="flex justify-center">
        <button 
          onClick={() => setStage('payment')}
          className="px-4 py-2 text-white/70 hover:text-white transition-colors"
          disabled={loading}
        >
          Отмена
        </button>
      </div>
    </div>
  );

  // Render success message
  const renderSuccess = () => (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="h-16 w-16 bg-[#58E877]/10 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="#58E877" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className="text-white/90 text-center text-xl font-medium">
        Платеж успешно выполнен!
      </div>
      
      <div className="text-white/60 text-center">
        Ваша подписка активирована. Теперь вам доступны все возможности сервиса.
      </div>
      
      <button 
        onClick={() => router.push('/home')}
        className="w-full h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] mt-4"
      >
        Вернуться на главную
      </button>
    </div>
  );

  // Render error message
  const renderError = () => (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className="text-white/90 text-center text-xl font-medium">
        Ошибка при оплате
      </div>
      
      <div className="text-white/60 text-center">
        {error || 'Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.'}
      </div>
      
      <div className="flex gap-4 w-full">
        <button 
          onClick={() => setStage('payment')}
          className="flex-1 h-[48px] rounded-lg border border-white/10 text-white font-medium flex items-center justify-center transition-colors hover:border-white/30"
        >
          Попробовать снова
        </button>
        
        <button 
          onClick={onClose || (() => router.push('/home'))}
          className="flex-1 h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Закрыть
        </button>
      </div>
    </div>
  );

  // Main render logic
  return (
    <div className="bg-[#121212] rounded-xl p-5 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">
          {stage === 'products' && 'Выбор тарифа'}
          {stage === 'payment' && 'Оплата подписки'}
          {stage === 'processing' && 'Обработка оплаты'}
          {stage === '3ds' && 'Подтверждение платежа'}
          {stage === 'success' && 'Успешная оплата'}
          {stage === 'error' && 'Ошибка оплаты'}
        </h2>
        {onClose && stage !== 'processing' && stage !== 'success' && (
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Content based on current stage */}
      {stage === 'products' && renderProductsView()}
      {stage === 'payment' && renderPaymentForm()}
      {stage === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="mt-4 text-white/70">Обработка платежа...</p>
        </div>
      )}
      {stage === '3ds' && render3DSVerification()}
      {stage === 'success' && renderSuccess()}
      {stage === 'error' && renderError()}
    </div>
  );
}
