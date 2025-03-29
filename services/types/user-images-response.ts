import { BaseResponse } from './base-response';

/**
 * Интерфейс изображения в коллекции пользователя
 */
export interface UserImage {
  /** Уникальный идентификатор изображения */
  id: number | string;
  
  /** URL для доступа к изображению */
  url: string;
  
  /** Запрос, использованный для генерации изображения */
  prompt: string;
  
  /** Стиль, применённый к изображению */
  style: string;
  
  /** Формат изображения (jpg, png, webp) */
  format: string;
  
  /** Timestamp создания изображения */
  created: number;
}

/**
 * Интерфейс ответа API со списком изображений пользователя
 */
export interface UserImagesResponse extends BaseResponse {
  /** Массив изображений пользователя */
  images: UserImage[];
  
  /** Общее количество изображений */
  total_count?: number;
  
  /** Индикатор активной подписки */
  is_subscribed?: boolean;

  /** Timestamp окончания подписки (UNIX timestamp) */
  subscription_end?: number;
}