import config from '../config/api-config';

// Product interfaces
export interface Product {
  id: number;
  product_id: string;
  description: string;
  amount: number;
  period: number;
  internal: string; // 'day', 'week', 'month'
  start_day: number;
  has_trial: boolean;
  currency: string;
  platform: string;
}

// Payment response interfaces
export interface PaymentResponse {
  success: boolean;
  message: string;
  model?: PaymentResponseModel;
  requires3DS?: boolean;  // Add this property to fix the type error
}

export interface PaymentResponseModel {
  transactionId?: string;
  paReq?: string;
  acsUrl?: string;
  email?: string;
  status?: number;
}

export interface SubscriptionResponse {
  is_subscribed: boolean;
  subscription_end: number;
  plan?: {
    name?: string;
    features?: string[];
  };
  days_left?: number;
  status: string;
  message: string;
  code: number;
}

export interface PaymentError {
  error: number;
  errorMessage: string;
  message: string;
  success: boolean;
}

// Payment request interfaces
export interface PaymentRequest {
  cardCryptogramPacket: string;
  email: string;
  productId: string;
  accountId: string;
  appId: string;
  ipAddress?: string;
}

export interface ThreeDsRequest {
  MD: string;
  PaRes: string;
  AppId: string;
}

export interface SyncRequest {
  reqUrl: string;
  password: string;
  email: string;
  productId: string;
}

// Card information interface for generating cryptogram
export interface CardInfo {
  cardNumber: string;
  expDateMonth: string;
  expDateYear: string;
  cvv: string;
  holderName?: string;
}

// Base URLs
const DEV_API_URL = 'https://dev.kid-control.com';
const PROD_API_URL = 'https://billing.mom';

class PayService {
  private baseUrl: string;
  private appId: string;
  private platform: string;
  private publicId: string; // CloudPayments public ID
  private proxyUrl: string; // PHP proxy URL

  constructor() {
    // Use development URL for now, can be switched with an environment variable
    this.baseUrl = config.NODE_ENV === 'production' ? PROD_API_URL : DEV_API_URL;
    this.appId = config.NODE_ENV === 'production' ? 'imageni.org' : "test.app1";
    this.platform = config.NODE_ENV === 'production' ? 'web' : 'ios';
    this.publicId = 'pk_b9cea9e10438e90910279fea9c6c5'; // Replace with your actual public key
    
    // URL to our PHP proxy
    this.proxyUrl = '/api/pay/pay.php';
  }

  /**
   * Generate a cryptogram for secure card payment
   * @param cardInfo Card information including number, expiration date, and CVV
   * @returns Promise with the generated cryptogram or error
   */
  async generateCryptogram(cardInfo: CardInfo): Promise<string> {
    // Make sure we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Функция доступна только в браузере');
    }
  
    // First, ensure the CloudPayments SDK is loaded
    if (!window.cp) {
      console.log('CloudPayments SDK не загружен. Загрузка...');
      
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.cloudpayments.ru/checkout.js';
        script.async = true;
        script.onload = () => {
          // Give it a moment to initialize
          setTimeout(resolve, 300);
        };
        script.onerror = () => reject(new Error('Не удалось загрузить CloudPayments SDK'));
        document.head.appendChild(script);
      });
    }
    
    // Ensure the SDK is now loaded
    if (!window.cp) {
      throw new Error('CloudPayments SDK не загружен после попытки динамической загрузки');
    }
    
    try {
      // Создаем экземпляр класса CloudPayments вместо Checkout
      const cp = new window.cp.Checkout({
        publicId: 'pk_b9cea9e10438e90910279fea9c6c5',
      });
      const fieldValues = {
        cvv: cardInfo.cvv,
        cardNumber: cardInfo.cardNumber,
        expDateMonth: cardInfo.expDateMonth,
        expDateYear: cardInfo.expDateYear,
      };

      return await cp.createPaymentCryptogram(fieldValues)
      
    } catch (error) {
      console.error('Ошибка генерации криптограммы:', error);
      throw error;
    }
  }

  /**
   * Process payment using the generated cryptogram
   * @param email User email
   * @param productId Product ID to purchase
   * @param cryptogram Generated payment cryptogram
   * @param deviceId Optional device identifier
   * @returns Payment response
   */
  async processPaymentWithCryptogram(
    email: string, 
    productId: string, 
    cryptogram: string, 
    deviceId: string = 'web'
  ): Promise<PaymentResponse> {
    const accountId = this.generateAccountId(deviceId, email);
    
    const request: PaymentRequest = {
      cardCryptogramPacket: cryptogram,
      email: email,
      productId: productId,
      accountId: accountId,
      appId: this.appId
    };
    
    return this.processPayment(request);
  }

  /**
   * Get all available products for the current app and platform
   */
  async getProducts(): Promise<Product[]> {
    try {
      const url = `${this.proxyUrl}?endpoint=getProducts&platform=${this.platform}&app_id=${this.appId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const products: Product[] = await response.json();
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get a specific product by ID
   */
  async getProductById(productId: number): Promise<Product> {
    try {
      const url = `${this.proxyUrl}?endpoint=getProductById&productId=${productId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const product: Product = await response.json();
      return product;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Make a payment request with card details
   * This should be called after creating a cryptogram with CloudPayments SDK
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const url = `${this.proxyUrl}?endpoint=processPayment`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      const data: PaymentResponse = await response.json();
      
      // If success is false and we have 3DS data, the payment requires 3DS verification
      if (!data.success && data.model && data.model.acsUrl) {
        return {
          ...data,
          requires3DS: true,
        };
      }
      
      return data;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  /**
   * Handle 3DS verification after payment attempt
   */
  async process3DSVerification(request: ThreeDsRequest): Promise<PaymentResponse> {
    try {
      const url = `${this.proxyUrl}?endpoint=process3DS`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      const data: PaymentResponse = await response.json();
      return data;
    } catch (error) {
      console.error('3DS verification error:', error);
      throw error;
    }
  }

  /**
   * Synchronize subscription with the main application server
   * Should be called after successful payment
   */
  async syncSubscription(request: SyncRequest): Promise<any> {
    try {
      const url = `${this.proxyUrl}?endpoint=syncSubscription`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Subscription sync error:', error);
      throw error;
    }
  }

  /**
   * Check the current subscription status
   */
  async checkSubscription(email: string): Promise<SubscriptionResponse> {
    try {
      const url = `${this.proxyUrl}?endpoint=checkSubscription`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          appId: this.appId,
          productId: 'test.test.app1' // Add default product ID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      const data = await response.json();
      console.log('Raw subscription data:', data); // Debug log
      
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      
      // Check if subscription is active based on expired_at field
      const isSubscribed = data.expired_at && data.expired_at > currentTime;
      
      // Calculate days left if expired_at exists
      const daysLeft = data.expired_at 
        ? Math.floor((data.expired_at - currentTime) / (60 * 60 * 24))
        : 0;
      
      // Transform the response to match our SubscriptionResponse interface
      const subscriptionResponse: SubscriptionResponse = {
        // Consider subscribed if there's a valid future expiration date
        is_subscribed: isSubscribed || data.active || data.is_subscribed || false,
        subscription_end: data.expired_at || data.expiryDate || data.subscription_end || 0,
        days_left: daysLeft || data.daysLeft || data.days_left || 0,
        status: isSubscribed || data.success ? 'ok' : 'error',
        message: data.message || '',
        code: isSubscribed || data.success ? 200 : 400,
        plan: {
          name: 'Pro',
          features: []
        }
      };
      
      console.log('Processed subscription data:', subscriptionResponse); // Additional debug log
      
      return subscriptionResponse;
    } catch (error) {
      console.error('Subscription check error:', error);
      throw error;
    }
  }

  /**
   * Cancel the current subscription
   */
  async cancelSubscription(email: string): Promise<any> {
    try {
      const url = `${this.proxyUrl}?endpoint=cancelSubscription`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, appId: this.appId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  /**
   * Generate an account ID from device ID and email
   */
  generateAccountId(deviceId: string, email: string): string {
    return `${deviceId}.${email}`;
  }
}

const payService = new PayService();
export default payService;