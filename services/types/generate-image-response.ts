import { BaseResponse } from './base-response';

/**
 * Интерфейс ответа API при генерации изображения
 */
export interface GenerateImageResponse extends BaseResponse {
  /** Уникальный идентификатор сгенерированного изображения */
  image_id?: number;
  
  /** URL для доступа к сгенерированному изображению */
  image_url?: string;
  
  /** Запрос, использованный для генерации изображения */
  prompt?: string;
  
  /** Стиль, применённый к изображению */
  style?: string;
  
  /** Формат изображения (jpg, png, webp) */
  format?: string;
  
  /** Timestamp создания изображения */
  created?: number;
  
  /** Флаг, указывающий, имеет ли пользователь активную подписку */
  is_subscribed?: boolean;
  
  /** Общее количество изображений у пользователя */
  image_count?: number;
  
  /** Timestamp окончания подписки пользователя (если есть) */
  subscription_end?: number;
}