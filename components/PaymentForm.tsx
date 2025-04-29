"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import payService, { CardInfo, Product } from '@/services/pay.service';
import authService from '@/services/auth.service';
import frontConfig from '@/config/api-config';

interface PaymentFormProps {
  onClose?: () => void;
  productId?: number; // Optional: pre-selected product ID
  onSuccess?: () => void; // Callback for successful payment
  onError?: (error: any) => void; // Callback for payment errors
}

// Add interface for config
interface Config {
  checkbox_mode: number;
  default_image_limit: number;
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [checking3DSResult, setChecking3DSResult] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // New state for product conditions and config
  const [productConditions, setProductConditions] = useState<string[]>([]);
  const [conditionsAccepted, setConditionsAccepted] = useState<Record<number, boolean>>({});
  const [config, setConfig] = useState<Config | null>(null);
  const [hasInteractedWithCheckbox, setHasInteractedWithCheckbox] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(true); // Состояние для управления отображением чекбоксов
  const router = useRouter();


  
  // Fetch config on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config/config.php');
        if (!response.ok) {
          throw new Error('Failed to fetch config');
        }
        const data = await response.json();
        if (data.status === 'success' && data.config) {
          setConfig(data.config);
          
          // Set default checkbox state based on checkbox_mode
          const defaultChecked = data.config.checkbox_mode === 1;
          setTermsAccepted(defaultChecked);
        }
      } catch (err) {
        console.error('Error fetching config:', err);
      }
    };
    
    fetchConfig();
  }, []);

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
            
            // Extract conditions from the selected product
            extractProductConditions(preselectedProduct);
            
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

  const extractProductConditions = (product: Product) => {
    const conditions: string[] = [];

    const getPeriodText = (value: number, interval: string) => {
      if (interval === 'day') return `${value} ${value === 1 ? 'день' : (value >= 2 && value <= 4) ? 'дня' : 'дней'}`;
      if (interval === 'week') return `${value} ${value === 1 ? 'неделя' : (value >= 2 && value <= 4) ? 'недели' : 'недель'}`;
      return `${value} ${value === 1 ? 'месяц' : (value >= 2 && value <= 4) ? 'месяца' : 'месяцев'}`;
    };

    if (product.has_trial) {
      const trialText = getPeriodText(product.start_day, 'day');
      const mainText = getPeriodText(product.period, product.interval); // Используем product.interval

      conditions.push(
        `Первый платёж в 1 ₽ за пробный период доступа в личный кабинет на ${trialText}, далее согласно тарифу: ${product.amount} ₽ за ${mainText} доступа к сервису`
      );
    } else {
      const mainText = getPeriodText(product.period, product.interval);
      conditions.push(
        `Я соглашаюсь на оплату ${product.amount} ₽ за ${mainText} использования сервиса`
      );
    }
  
    setProductConditions(conditions);
  
    // Initialize conditions acceptance state based on checkbox_mode
    const defaultChecked = config?.checkbox_mode === 1;
    const initialState: Record<number, boolean> = {};
    conditions.forEach((_, index) => {
      initialState[index] = defaultChecked;
    });
    setConditionsAccepted(initialState);
  };
  

  // Update product conditions when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      extractProductConditions(selectedProduct);
    }
  }, [selectedProduct, config?.checkbox_mode]);
  useEffect(() => {
    const utmCampaign = localStorage.getItem('utm_campaign');

    if (utmCampaign === 'partner_5percent') {
      setConditionsAccepted((prev) => {
        const newConditions = { ...prev };
        // Устанавливаем все условия в true
        productConditions.forEach((_, index) => {
          newConditions[index] = true;
        });
        return newConditions;
      });
      setShowCheckboxes(false); // Скрываем чекбоксы
      localStorage.removeItem('utm_campaign'); // Удаляем элемент из локального хранилища
    }
  }, []);
  // Handler for checkbox changes
  const handleCheckboxChange = (index: number | 'terms') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasInteractedWithCheckbox(true);
    
    if (index === 'terms') {
      setTermsAccepted(e.target.checked);
    } else {
      setConditionsAccepted(prev => ({
        ...prev,
        [index]: e.target.checked
      }));
    }
  };

  // Check if all checkboxes are accepted
  const areAllConditionsAccepted = () => {
    if (!termsAccepted) return false;
    
    return Object.values(conditionsAccepted).every(accepted => accepted);
  };

  // Determine if payment button should be enabled
  const isPaymentButtonEnabled = () => {
    // If checkbox_mode is 2 and user has not interacted with checkboxes, enable button
    if (config?.checkbox_mode === 2 && !hasInteractedWithCheckbox) {
      return true;
    }
    
    // Otherwise, check if all conditions are accepted
    return areAllConditionsAccepted();
  };

  const validateForm = () => {
    if (!isPaymentButtonEnabled()) {
      setError('Необходимо принять все условия использования сервиса');
      return false;
    }

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

  // Format card number with spaces
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

  // Input handler for card number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };

  // Input handler for expiration month
  const handleExpMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    
    // Allow leading zeros and ensure the value is between 1-12 if it's a two-digit number
    if (value === '' || (value.length <= 2 && (value.length === 1 || parseInt(value) >= 1 && parseInt(value) <= 12))) {
      setExpMonth(value);
    }
  };

  // Input handler for expiration year
  const handleExpYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setExpYear(value);
  };

  // Input handler for CVV
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    extractProductConditions(product);
    setStage('payment');
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm() || !selectedProduct || !userEmail) {
      return;
    }

    setLoading(true);
    setStage('processing');

    try {
      const cardInfo: CardInfo = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expDateMonth: expMonth.padStart(2, '0'),
        expDateYear: '20' + expYear.padStart(2, '0'),
        cvv: cvv,
        holderName: name
      };

      const cryptogram = await payService.generateCryptogram(cardInfo);
      console.log('Cryptogram generated successfully');

      const paymentResult = await payService.processPaymentWithCryptogram(
        userEmail,
        selectedProduct.product_id,
        cryptogram
      );

      if (paymentResult.requires3DS && paymentResult.model?.acsUrl && paymentResult.model?.paReq && paymentResult.model?.transactionId) {
        console.log('3DS verification required');

        localStorage.setItem('3ds_transaction_id', paymentResult.model.transactionId);
        localStorage.setItem('selected_product_id', selectedProduct.id.toString());
        localStorage.setItem('selected_product_time', Date.now().toString());

        const termUrl = `${window.location.origin}/api/pay/3dscallback.php`;

        setPendingRedirect(true);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentResult.model.acsUrl;
        form.style.display = 'none';

        const addParam = (name: string, value: string) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };

        addParam('PaReq', paymentResult.model.paReq);
        addParam('MD', paymentResult.model.transactionId);
        addParam('TermUrl', termUrl);

        document.body.appendChild(form);

        setTimeout(() => {
          form.submit();
        }, 500);
      } else if (paymentResult.success) {
        console.log('Payment successful without 3DS');
        setStage('success');
        onSuccess && onSuccess();
      } else {
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
      if (!pendingRedirect) {
        setLoading(false);
      }
    }
  };

  // Activate user subscription
  const activateUserSubscription = async () => {
    if (!userEmail) {
      throw new Error('User email not found');
    }

    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }

    console.log('Activating subscription for user:', userEmail);

    const response = await fetch('/api/subscribe/manage.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'activate',
        token: token
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to activate subscription');
    }

    const result = await response.json();
    console.log('Subscription activation result:', result);

    return result;
  };

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
                  {product.period} {product.interval === 'day' ? 'дней' : product.interval === 'week' ? 'недель' : 'месяцев'}
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

  const renderPaymentForm = () => (
    <div>
      <h3 className="text-lg font-medium text-white mb-2">Оплата</h3>

      {selectedProduct && (
        <div className="bg-[#1A1A1A] p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-white/80">{selectedProduct.description}</p>
              <p className="text-xs text-white/60">
                {selectedProduct.period} {selectedProduct.interval === 'day' ? 'дней' : selectedProduct.interval === 'week' ? 'недель' : 'месяцев'}
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
        {showCheckboxes && (
          <>
          {/* Product condition checkboxes */}
          {productConditions.map((condition, index) => (
            <div className="flex items-start mt-4" key={`condition-${index}`}>
              <input
                type="checkbox"
                id={`condition-${index}`}
                checked={conditionsAccepted[index] || false}
                onChange={handleCheckboxChange(index)}
                className="mt-1 mr-2"
              />
              <label htmlFor={`condition-${index}`} className="text-sm text-white/70">
                {condition}
              </label>
            </div>
          ))}

          {/* Terms checkbox */}
          <div className="flex items-start mt-4">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={handleCheckboxChange('terms')}
              className="mt-1 mr-2"
            />
            <label htmlFor="terms" className="text-sm text-white/70">
              Я принимаю <a href="/terms" target="_blank" className="underline text-white/90 hover:text-white">условия использования</a> сервиса и даю согласие на списание средств с моей карты
            </label>
          </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            type="button"
            onClick={() => setStage('products')}
            className="h-[48px] rounded-lg border border-white/10 text-white font-medium flex items-center justify-center transition-colors hover:border-white/30"
          >
            Назад
          </button>

          <button
            type="submit"
            disabled={loading || !isPaymentButtonEnabled()}
            className={`h-[48px] rounded-lg bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium flex items-center justify-center transition-transform ${
              loading || !isPaymentButtonEnabled() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? "Обработка..." : "Оплатить"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-white/70 text-xs">
          <svg width="16" height="16" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.72">
              <path d="M18.875 9.75H17.75V8.24999C17.75 5.35512 15.3949 3 12.5 3C9.60509 3 7.25001 5.35512 7.25001 8.24999V9.75H6.12501C5.91773 9.75 5.75 9.91773 5.75 10.125V19.5C5.75 20.3273 6.42271 21 7.25001 21H17.75C18.5773 21 19.25 20.3273 19.25 19.5V10.125C19.25 9.91773 19.0823 9.75 18.875 9.75ZM13.6228 17.5836C13.6345 17.6894 13.6005 17.7956 13.5294 17.8751C13.4584 17.9546 13.3566 18 13.25 18H11.75C11.6435 18 11.5416 17.9546 11.4706 17.8751C11.3995 17.7957 11.3655 17.6895 11.3772 17.5836L11.6138 15.4563C11.2296 15.1769 11 14.7349 11 14.25C11 13.4227 11.6727 12.75 12.5 12.75C13.3273 12.75 14 13.4227 14 14.25C14 14.7349 13.7704 15.1769 13.3863 15.4563L13.6228 17.5836ZM15.5 9.75H9.50001V8.24999C9.50001 6.59582 10.8458 5.25 12.5 5.25C14.1542 5.25 15.5 6.59582 15.5 8.24999V9.75Z" fill="currentColor" />
            </g>
          </svg>
          <span>Ваши данные защищены</span>
        </div>
        
      </form>
    </div>
    
  );

  const renderRedirecting = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      <p className="mt-4 text-white/70">Перенаправление на страницу банка...</p>
      <p className="mt-2 text-white/50 text-sm">Пожалуйста, не закрывайте страницу</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="h-16 w-16 bg-[#58E877]/10 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="#58E877" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

  const renderError = () => (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6L18 18" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

  return (
    <div className="bg-[#121212] rounded-xl p-5 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">
          {stage === 'products' && 'Выбор тарифа'}
          {stage === 'payment' && 'Оплата подписки'}
          {stage === 'processing' && (pendingRedirect ? 'Перенаправление' : 'Обработка оплаты')}
          {stage === '3ds' && 'Подтверждение платежа'}
          {stage === 'success' && 'Успешная оплата'}
          {stage === 'error' && 'Ошибка оплаты'}
        </h2>
        {onClose && stage !== 'processing' && stage !== 'success' && !pendingRedirect && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {stage === 'products' && renderProductsView()}
      {stage === 'payment' && renderPaymentForm()}
      {stage === 'processing' && (
        pendingRedirect ? renderRedirecting() : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="mt-4 text-white/70">Обработка платежа...</p>
          </div>
        )
      )}
      {stage === 'success' && renderSuccess()}
      {stage === 'error' && renderError()}
    </div>
  );
}