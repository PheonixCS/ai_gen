// pay.service.ts
import config from '../config/api-config';

interface PaymentResponse {
  pay: 'ok' | 'error';
  em: string;
  code: number;
  user_id?: number;
  timestamp?: number;
  debug?: string;
}

interface PaymentError {
  error: string;
  code: number;
  details?: any;
}

interface SubscriptionOptions {
  email: string;
  period?: number; // in days
  newExpiringDate?: number; // timestamp
}

class PayService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${config.domain}/api_pay.php`; // Assuming the endpoint is api_pay.php
  }

  /**
   * Process subscription payment
   * @param options Subscription options including email and either period or expiration date
   * @returns Promise with payment response or error
   */
  async processSubscription(options: SubscriptionOptions): Promise<PaymentResponse> {
    try {
      // Validate required fields
      if (!options.email) {
        throw { error: 'Email is required', code: -400 };
      }

      // At least one of period or newExpiringDate must be provided
      if (!options.period && !options.newExpiringDate) {
        throw { error: 'Either period or expiration date must be provided', code: -400 };
      }

      // Prepare form data similar to PHP implementation
      const formData = new FormData();
      formData.append('em', encodeURIComponent(options.email));
      
      if (options.period) {
        formData.append('period', options.period.toString());
      }
      
      if (options.newExpiringDate) {
        formData.append('newExpiringDate', options.newExpiringDate.toString());
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw { error: 'Network response was not ok', code: response.status };
      }

      const data: PaymentResponse = await response.json();

      if (data.pay === 'error') {
        throw { error: 'Payment processing failed', code: data.code, details: data };
      }

      return data;
    } catch (error) {
      console.error('Payment error:', error);
      throw this.normalizeError(error);
    }
  }

  /**
   * Process trial subscription (1 RUB for 3 days)
   * @param email User email
   * @returns Promise with payment response
   */
  async processTrialSubscription(email: string): Promise<PaymentResponse> {
    // Calculate expiration date (now + 3 days)
    const trialPeriodDays = 3;
    const trialExpiration = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * trialPeriodDays);
    
    return this.processSubscription({
      email,
      newExpiringDate: trialExpiration
    });
  }

  /**
   * Process regular subscription
   * @param email User email
   * @param periodDays Subscription period in days (7, 30, etc.)
   * @returns Promise with payment response
   */
  async processRegularSubscription(email: string, periodDays: number): Promise<PaymentResponse> {
    return this.processSubscription({
      email,
      period: periodDays
    });
  }

  private normalizeError(error: any): PaymentError {
    if (error instanceof Error) {
      return { error: error.message, code: -500 };
    }
    return error;
  }
}

const payService = new PayService();
export default payService;