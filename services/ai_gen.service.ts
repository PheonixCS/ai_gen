import {
  BaseResponse,
  GenerateImageResponse,
  UserImagesResponse,
  SubscriptionResponse,
  UserImage
} from './types/api-responses';

import apiClient from './api-client';
import authService from './auth.service';
import config  from '../config/api-config';
export interface GenerateImageParams {
  prompt: string;
  style_preset?: StylePreset;
  output_format?: OutputFormat;
  aspect_ratio?: string;
}

export interface ApiImage {
  id: number;
  img_id?: number;  // Дублирующее поле в некоторых ответах
  prompt: string;
  text?: string;    // Дублирующее поле для промпта
  style: string;
  format: string | null;
  created: number;
  t?: number;       // Альтернативное поле для времени создания
  size: number;
  url?: string;     // Опционально может содержать URL
  code?: number;    // Код результата генерации
  msg?: string;     // Сообщение о результате
  status?: string;  // Статус процесса генерации
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

export interface LegacyApiParams {
  em: string;           // User email
  pass: string;         // User password
  text?: string;        // Prompt for image generation
  style?: string;       // Style preset
  img?: number;         // Image ID (0 for new image)
  size?: string;        // Image aspect ratio as "AxB" (e.g. "1x1", "4x3")
  uid?: string;         // Optional user ID
}

export interface LegacyApiResponse {
  log: string;          // 'success' or 'error'
  msg: string;          // Status message
  code: number;         // Status code (200 for success)
  user_id: number;      // User ID
  timestamp: number;    // Timestamp/subscription end time
  email: string;        // User email
  pass: string;         // User password
  sub: 'y' | 'n';       // Subscription status
  usage_7d: number;     // Usage count in last 7 days
  images?: ApiImage[];  // Array of user images (when fetching all images)
  answer?: any;         // Answer data when generating a new image
}

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

  /**
   * Fetch images or generate new image using legacy API
   * @param params Parameters for the legacy API
   * @returns Promise with the API response
   */
  async fetchImagesFromLegacyApi(params: LegacyApiParams): Promise<LegacyApiResponse> {
    try {
      // Construct FormData for the request
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Make the API request
      const response = await fetch('/imageni_clean/api_img.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data.log === 'error') {
        throw {
          status: 'error',
          message: data.msg || 'Unknown error',
          code: data.code || 500
        };
      }

      return data as LegacyApiResponse;
    } catch (error) {
      console.error('Error fetching from legacy API:', error);
      throw error;
    }
  }

  /**
   * Generate an image using the legacy API
   * @param prompt Text prompt for the image
   * @param style Optional style preset
   * @param aspectRatio Optional aspect ratio as string (e.g. "1x1", "4x3")
   * @returns Promise with the generated image data
   */
  async generateImageWithLegacyApi(
    prompt: string,
    style: string = 'photographic',
    aspectRatio: string = '1x1'
  ): Promise<GeneratedImage> {
    const currentUser = authService.getCurrentUser();
    const password = authService.getUserPassword();
    
    if (!currentUser || !currentUser.email || !password) {
      throw new Error('User not authenticated or credentials missing');
    }

    // Map aspect ratio from new format to legacy format
    let sizeFormat = '1x1';
    switch (aspectRatio) {
      case '1:1': sizeFormat = '1x1'; break;
      case '4:5': sizeFormat = '4x5'; break;
      case '2:3': sizeFormat = '2x3'; break;
      case '3:2': sizeFormat = '3x2'; break;
      case '3:4': sizeFormat = '3x4'; break;
      case '4:3': sizeFormat = '4x3'; break;
      case '16:9': sizeFormat = '16x9'; break;
      case '9:16': sizeFormat = '9x16'; break;
    }
    
    try {
      // Generate a timestamp for the image ID
      const imgId = Math.floor(Date.now() / 1000);
      
      const response = await this.fetchImagesFromLegacyApi({
        em: currentUser.email,
        pass: password,
        text: prompt,
        style: style,
        img: imgId,
        size: sizeFormat
      });

      // Check if response is successful
      if (response.log === 'success' && response.code === 200) {
        // Check if we have an answer object with URL
        if (response.answer && response.answer.url) {
          return {
            image_id: imgId,
            image_url: response.answer.url,
            prompt: prompt,
            style: style,
            format: 'webp', // Legacy API uses webp format
            created: Math.floor(Date.now() / 1000),
            is_subscribed: response.sub === 'y',
            image_count: response.usage_7d || 0,
            subscription_end: response.timestamp
          };
        } 
        // Check if we have images array with the latest image
        else if (response.images && response.images.length > 0) {
          // Get the most recent image from the array (last one)
          const latestImage = response.images[response.images.length - 1];
          
          // Construct the URL based on the image ID and user ID
          // const imageUrl = `https://imageni.ai/db/img/${response.user_id}/${latestImage.img_id || latestImage.id}.${latestImage.format || 'webp'}`;
          const imageUrl = config.domain + '/db/img/' + response.user_id + '/' + latestImage.img_id || latestImage.id + '.' + (latestImage.format || 'webp');
          
          return {
            image_id: latestImage.img_id || latestImage.id,
            image_url: imageUrl,
            prompt: latestImage.prompt || prompt,
            style: latestImage.style || style,
            format: latestImage.format || 'webp',
            created: latestImage.created || Math.floor(Date.now() / 1000),
            is_subscribed: response.sub === 'y',
            image_count: response.usage_7d || 0,
            subscription_end: response.timestamp
          };
        }
        else {
          throw new Error('No image data in the API response');
        }
      } else if (response.answer && response.answer.code === -8000) {
        // Handle usage limit error
        throw {
          status: 'error',
          message: 'Usage limit reached',
          code: 403,
          current_count: response.usage_7d || 0,
          limit: 20,
          is_subscribed: response.sub === 'y'
        };
      } else {
        throw new Error('Failed to generate image: ' + (response.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating image with legacy API:', error);
      throw error;
    }
  }

  /**
   * Get all images for the current user using the legacy API
   * @returns Promise with array of user images
   */
  async getUserImagesWithLegacyApi(): Promise<GeneratedImage[]> {
    const currentUser = authService.getCurrentUser();
    const password = authService.getUserPassword();
    
    if (!currentUser || !currentUser.email || !password) {
      throw new Error('User not authenticated or credentials missing');
    }
    
    try {
      const response = await this.fetchImagesFromLegacyApi({
        em: currentUser.email,
        pass: password
      });
      
      if (response.images && Array.isArray(response.images)) {
        return response.images.map(img => ({
          image_id: img.img_id || img.id,
          image_url: img.url || `https://imageni.ai/db/img/${response.user_id}/${img.img_id || img.id}.webp`,
          prompt: img.text || img.prompt || '',
          style: img.style || 'photographic',
          format: img.format || 'webp',
          created: img.t || img.created || 0,
          is_subscribed: response.sub === 'y',
          image_count: response.usage_7d || 0,
          subscription_end: response.timestamp
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting images with legacy API:', error);
      throw error;
    }
  }

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