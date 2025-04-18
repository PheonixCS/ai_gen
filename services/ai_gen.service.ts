import axios from 'axios';
import config from '@/config/api-config';

import {
  BaseResponse,
  GenerateImageResponse,
  UserImagesResponse,
  SubscriptionResponse,
  UserImage
} from './types/api-responses';

import apiClient from './api-client';
import authService from './auth.service';
import payService from './pay.service';
export interface GenerateImageParams {
  prompt: string;
  style_preset?: string;
  output_format?: string;
  aspect_ratio?: string;
  negative_prompt?: string;
}

// Update response interface to match API documentation
export interface ApiImagesResponse {
  status: string;
  image_id: string;
  image_url: string;
  prompt: string;
  style: string;
  format: string;
  created: number;
  is_subscribed: boolean;
  image_count: number;
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
  status: string;
  message?: string;
  code?: number;
  images?: Array<{
    prompt: string;
    style_preset: string;
    filename: string;
    file_path: string;
    output_format: string;
    timestamp: number;
    user_id: string;
    metadata_file: string;
    generation_id: string;
  }>;
}

// Интерфейс для использования внутри приложения (без изменения)
export interface GeneratedImage {
  status: string;
  image_id?: string;
  image_url: string;
  prompt?: string;
  style?: string;
  format?: string;
  created?: number;
  is_subscribed?: boolean;
  image_count?: number;
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

// Updated API error response interface
export interface ApiErrorResponse {
  code: number;
  msg: string;
  current_count?: number;
  limit?: number;
}

// Updated API success response interface
export interface ApiSuccessResponse {
  status: string;
  image_id: string;
  image_url: string;
  prompt: string;
  style: string;
  format: string;
  created: number;
  is_subscribed: boolean;
  image_count: number;
}

// Union type for all possible API responses
export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

class AIGenerationService {
  // Function to activate user's subscription
  async activateUserSubscription(userEmail: string): Promise<SubscriptionResponse> {
      if (!userEmail) {
        throw new Error('User email not found');
      }
      
      // Get current authentication token
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
  // Generate image according to API documentation
  async generateImage(params: GenerateImageParams, email: string, password: string): Promise<ApiResponse> {
    try {
      // First check if user is subscribed
      const user = authService.getCurrentUser();
      if (user) {
        const subscriptionStatus = await payService.checkSubscription(user.email);
        
        // If user is subscribed, ensure subscription is activated on the server
        if (subscriptionStatus.is_subscribed) {
          try {
            console.log('User has PRO subscription, activating on server before image generation');
            await this.activateUserSubscription(email);
          } catch (subscriptionError) {
            console.error('Failed to activate subscription, continuing with image generation:', subscriptionError);
            // Continue with image generation even if subscription activation fails
          }
        }
      }
      
      // Create form data to match what the PHP backend expects
      const formData = new URLSearchParams();
      formData.append('em', email);
      formData.append('pass', password);
      formData.append('prompt', params.prompt);
      formData.append('style_preset', params.style_preset || 'photographic');
      formData.append('output_format', params.output_format || 'webp');
      formData.append('aspect_ratio', params.aspect_ratio || '1:1');

      const response = await axios.post(`/api/img/img.php`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Pass through the API error information
        throw error.response.data;
      }
      throw error;
    }
  }

  // Get image history according to API documentation
  async getImageHistory(email: string, password: string): Promise<any> {
    try {
      // Create form data to match what the PHP backend expects
      const formData = new URLSearchParams();
      formData.append('em', email);
      formData.append('pass', password);

      const response = await axios.post(`/api/img/history.php`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw error;
    }
  }
}

export const aiGenerationService = new AIGenerationService();