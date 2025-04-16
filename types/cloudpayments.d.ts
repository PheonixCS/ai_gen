/**
 * Type definitions for CloudPayments SDK
 */

declare namespace cp {
  class Checkout {
    constructor(config: { publicId: string });
    
    createPaymentCryptogram(cardInfo: {
      cardNumber: string;
      expDateMonth: string;
      expDateYear: string;
      cvv: string;
    }): Promise<string>;
  }

  class CloudPayments {
    constructor(config: { publicId: string });
    
    pay(
      scenario: string, 
      paymentOptions: any, 
      cardData: {
        cardNumber: string;
        cardExp: string;
        cardCvv: string;
      },
      callbacks: {
        onSuccess?: (options: any) => void;
        onFail?: (reason: string, options: any) => void;
        onComplete?: (paymentResult: any, options: any) => void;
        onGenerateToken?: (token: string) => boolean;
      }
    ): void;
  }

  function createCryptogram(options: {
    publicId: string;
    cardNumber: string;
    cardExp: string;
    cardCvv: string;
  }): {
    success: boolean;
    cryptogram?: string;
    message?: string;
  };
}

interface Window {
  cp: typeof cp;
}
