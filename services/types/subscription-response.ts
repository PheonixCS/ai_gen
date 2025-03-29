import { BaseResponse } from './base-response';

/**
 * Интерфейс ответа API о статусе подписки
 */
export interface SubscriptionResponse extends BaseResponse {
  /** Флаг активной подписки */
  is_subscribed: boolean;
  
  /** Timestamp окончания подписки (UNIX timestamp) */
  subscription_end: number;
  
  /** Дополнительная информация о тарифе (если есть) */
  plan?: {
    name?: string;
    features?: string[];
  };
  
  /** Количество дней до окончания подписки */
  days_left?: number;
}