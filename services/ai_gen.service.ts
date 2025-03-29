import {
  BaseResponse,
  GenerateImageResponse,
  UserImagesResponse,
  SubscriptionResponse,
  UserImage
} from './types/api-responses';

import apiClient from './api-client';
import authService from './auth.service';

export interface GenerateImageParams {
  prompt: string;
  style_preset?: StylePreset;
  output_format?: OutputFormat;
}

export interface ApiImage {
  id: number;
  img_id?: number;  // Дублирующее поле в некоторых ответах
  prompt: string;
  style: string;
  format: string | null;
  created: number;
  size: number;
  url?: string;    // Опционально может содержать URL
}

// Интерфейс для ответа API со списком изображений
export interface ApiImagesResponse {
  log: string;
  msg: string;
  code: number;
  user_id: number;
  timestamp: number;
  email: string;
  pass: string;
  sub: 'y' | 'n';  // Строковый индикатор подписки ('y'/'n')
  usage_7d: number;
  images: ApiImage[];
}

// Интерфейс для использования внутри приложения (без изменения)
export interface GeneratedImage {
  image_id: number;
  image_url: string;
  prompt: string;
  style: string;
  format: string;
  created: number;
  is_subscribed: boolean;
  image_count: number;
  subscription_end?: number;
}

export type StylePreset = 
  | '3d-model'
  | 'analog-film'
  | 'anime'
  | 'cinematic'
  | 'comic-book'
  | 'digital-art'
  | 'futuristic'
  | 'fantasy-art'
  | 'isometric'
  | 'line-art'
  | 'low-poly'
  | 'modeling-compound'
  | 'neon-punk'
  | 'origami'
  | 'photographic'
  | 'pixel-art'
  | 'tile-texture';

export type OutputFormat = 'jpeg' | 'png' | 'webp';

export class AIGenerationService {
  /**
   * Генерирует изображение для текущего авторизованного пользователя
   * @param params Параметры генерации изображения
   * @returns Информация о сгенерированном изображении
   */
  async generateImageForCurrentUser(params: GenerateImageParams): Promise<GeneratedImage> {
    const currentUser = authService.getCurrentUser();
    const password = authService.getUserPassword();
    
    if (!currentUser || !currentUser.email || !password) {
      throw new Error('Пользователь не авторизован или отсутствуют учетные данные');
    }
    
    return this.generateImage(params, currentUser.email, password);
  }
  
  /**
   * Генерирует изображение на основе указанных параметров
   * @param params Параметры для генерации изображения
   * @param email Email пользователя
   * @param password Пароль пользователя
   * @returns Промис с информацией о сгенерированном изображении
   */
  async generateImage(
    params: GenerateImageParams,
    email: string, 
    password: string
  ): Promise<GeneratedImage> {
    try {
      // Используем ApiClient для взаимодействия с прокси-сервером
      const response = await apiClient.generateImage({
        ...params,
        em: email,
        pass: password
      });
      
      if (!response) {
        throw new Error('No response from API');
      }
      
      return response as GeneratedImage;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  /**
   * Получает список изображений для текущего авторизованного пользователя
   * @returns Список изображений пользователя
   */
  async getCurrentUserImages(): Promise<GeneratedImage[]> {
    const currentUser = authService.getCurrentUser();
    const password = authService.getUserPassword();
    
    if (!currentUser || !currentUser.email || !password) {
      throw new Error('Пользователь не авторизован или отсутствуют учетные данные');
    }
    
    return this.getUserImages(currentUser.email, password);
  }

  /**
   * Получает список изображений пользователя
   * @param email Email пользователя
   * @param password Пароль пользователя
   * @returns Промис со списком изображений пользователя
   */
  async getUserImages(email: string, password: string): Promise<GeneratedImage[]> {
    try {
      const response = await apiClient.getUserImages(email, password);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to get user images');
      }
      
      // Преобразуем UserImage[] в GeneratedImage[]
      return (response.images || []).map(image => this.mapUserImageToGeneratedImage(image, response));
    } catch (error) {
      console.error('Error getting user images:', error);
      throw error;
    }
  }

  /**
   * Преобразует UserImage в GeneratedImage
   * @param image Изображение из API ответа
   * @param response Полный ответ от API для получения дополнительной информации
   * @returns Объект с информацией об изображении в формате приложения
   */
  private mapUserImageToGeneratedImage(image: UserImage, response: UserImagesResponse): GeneratedImage {
    return {
      // Используем преобразование типов для id, так как оно может быть строкой или числом
      image_id: typeof image.id === 'string' ? parseInt(image.id, 10) : image.id,
      image_url: image.url,
      prompt: image.prompt,
      // Используем значения из API или значения по умолчанию, если они отсутствуют
      style: image.style || 'photographic',
      format: image.format || 'webp',
      created: image.created || Date.now(),
      // Дополнительная информация из общего ответа API
      is_subscribed: response.is_subscribed || false,
      image_count: response.total_count || 0,
      // Используем оператор опциональной последовательности для безопасного доступа к свойству
      subscription_end: response.subscription_end
    };
  }

  /**
   * Проверяет статус подписки текущего пользователя
   * @returns Информация о подписке
   */
  async checkCurrentUserSubscription(): Promise<{ is_subscribed: boolean, subscription_end: number, days_left: number }> {
    const currentUser = authService.getCurrentUser();
    const password = authService.getUserPassword();
    
    if (!currentUser || !currentUser.email || !password) {
      throw new Error('Пользователь не авторизован или отсутствуют учетные данные');
    }
    
    return this.checkUserSubscription(currentUser.email, password);
  }
  
  /**
   * Проверяет статус подписки пользователя
   * @param email Email пользователя
   * @param password Пароль пользователя
   * @returns Информация о подписке
   */
  async checkUserSubscription(email: string, password: string): Promise<{ is_subscribed: boolean, subscription_end: number, days_left: number }> {
    try {
      const response = await apiClient.checkSubscription(email, password);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to check subscription');
      }
      
      const now = Math.floor(Date.now() / 1000);
      const endTime = response.subscription_end || 0;
      const daysLeft = endTime > now ? Math.ceil((endTime - now) / (24 * 60 * 60)) : 0;
      
      return {
        is_subscribed: response.is_subscribed,
        subscription_end: response.subscription_end,
        days_left: daysLeft
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      throw error;
    }
  }

  // /**
  //  * Удаляет изображение текущего пользователя
  //  * @param imageId ID изображения для удаления
  //  * @returns Результат операции удаления
  //  */
  // async deleteCurrentUserImage(imageId: number): Promise<{ success: boolean, message: string }> {
  //   const currentUser = authService.getCurrentUser();
  //   const password = authService.getUserPassword();
    
  //   if (!currentUser || !currentUser.email || !password) {
  //     throw new Error('Пользователь не авторизован или отсутствуют учетные данные');
  //   }
    
  //   return this.deleteUserImage(imageId, currentUser.email, password);
  // }
  
  // /**
  //  * Удаляет изображение пользователя
  //  * @param imageId ID изображения для удаления
  //  * @param email Email пользователя
  //  * @param password Пароль пользователя
  //  * @returns Результат операции удаления
  //  */
  // async deleteUserImage(imageId: number, email: string, password: string): Promise<{ success: boolean, message: string }> {
  //   try {
  //     const response = await apiClient.deleteImage({
  //       image_id: imageId,
  //       em: email,
  //       pass: password
  //     });
      
  //     if (response.status === 'error') {
  //       throw new Error(response.message || 'Failed to delete image');
  //     }
      
  //     return {
  //       success: true,
  //       message: response.message || 'Image successfully deleted'
  //     };
  //   } catch (error) {
  //     console.error('Error deleting image:', error);
  //     return {
  //       success: false,
  //       message: error instanceof Error ? error.message : 'Unknown error occurred'
  //     };
  //   }
  // }

  /**
   * Преобразует URL изображения в Data URL для отображения
   * @param imageUrl URL изображения
   * @returns Промис с Data URL изображения
   */
  async imageToDataURL(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      return this.blobToDataURL(blob);
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      throw error;
    }
  }
  
  /**
   * Преобразует Blob в Data URL
   * @param blob Blob изображения
   * @returns Промис с Data URL
   */
  async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  /**
   * Скачивает изображение по URL
   * @param imageUrl URL изображения
   * @param filename Имя файла для загрузки
   */
  async downloadImage(imageUrl: string, filename: string): Promise<void> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Устанавливаем имя файла
      const extension = blob.type.split('/')[1] || 'webp';
      a.download = `${filename}.${extension}`;
      
      // Добавляем элемент на страницу, имитируем клик и удаляем
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }
  
  /**
   * Обрабатывает ошибки API
   * @param error Объект ошибки
   * @returns Сообщение об ошибке
   */
  getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return 'Unknown error occurred';
    }
  }
}

// Экспортируем синглтон для удобного использования
export const aiGenerationService = new AIGenerationService();