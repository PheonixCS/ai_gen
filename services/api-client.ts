import apiConfig from '../config/api-config';
import {
  BaseResponse,
  GenerateImageResponse,
  UserImagesResponse,
  SubscriptionResponse
} from './types/api-responses';

export class ApiClient {
  private baseUrl: string;
  private proxyEnabled: boolean;

  constructor(baseUrl: string = apiConfig.domain, proxyEnabled: boolean = apiConfig.proxyEnabled) {
    this.baseUrl = baseUrl;
    this.proxyEnabled = proxyEnabled;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public enableProxy(enabled: boolean): void {
    this.proxyEnabled = enabled;
  }

  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Use our Next.js API route to avoid CORS issues
        console.log('Using proxy API route for login');
        try {
          response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          // Check if the response is ok
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Proxy API route returned status ${response.status}: ${errorText}`);
            // Fall back to direct API call if proxy fails
            console.log('Falling back to direct API call');
            this.proxyEnabled = false;
            return this.login(email, password);
          }
        } catch (proxyError) {
          console.error('Proxy API route error:', proxyError);
          // Fall back to direct API call if proxy fails
          console.log('Falling back to direct API call');
          this.proxyEnabled = false;
          return this.login(email, password);
        }
      } else {
        // Direct API call (will have CORS issues in browser)
        console.log('Using direct API call for login');
        response = await fetch(`${this.baseUrl}${apiConfig.endpoints.login}?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      // Fix the response structure to ensure consistent format
      return {
        code: data.code || 500,
        message: data.msg || data.message || 'Unknown response',
        log: data.log || '',
        userId: data.user_id || 0,
        sub: data.sub || '',
        timestamp: data.timestamp || 0,
        verify: data.verify || 0
      };
    } catch (error) {
      console.error('Login API error:', error);
      return { code: 500, message: 'Service error occurred' };
    }
  }

  async register(email: string, password: string): Promise<ApiResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Use our Next.js API route to avoid CORS issues
        response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
      } else {
        // Direct API call
        response = await fetch(`${this.baseUrl}${apiConfig.endpoints.register}?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`);
      }
      
      const data = await response.json();
      
      return {
        code: data.code || 500,
        message: data.msg || data.message || 'Unknown response',
        log: data.log || '',
        userId: data.user_id || 0
      };
    } catch (error) {
      console.error('Register API error:', error);
      return { code: 500, message: 'Service error occurred' };
    }
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
      } else {
        response = await fetch(`${this.baseUrl}${apiConfig.endpoints.resetPassword}?em=${encodeURIComponent(email)}`);
      }
      
      const data = await response.json();
      
      return {
        code: data.code || 500,
        message: data.msg || data.message || 'Unknown response'
      };
    } catch (error) {
      console.error('Password reset request API error:', error);
      return { code: 500, message: 'Service error occurred' };
    }
  }

  async verifyResetCode(email: string, code: string): Promise<ApiResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, checkCode: code }),
        });
      } else {
        response = await fetch(`${this.baseUrl}${apiConfig.endpoints.resetPassword}?em=${encodeURIComponent(email)}&check_code=${encodeURIComponent(code)}`);
      }
      
      const data = await response.json();
      
      return {
        code: data.code || 500,
        message: data.msg || data.message || 'Unknown response'
      };
    } catch (error) {
      console.error('Verify reset code API error:', error);
      return { code: 500, message: 'Service error occurred' };
    }
  }

  async changePassword(email: string, code: string, newPassword: string): Promise<ApiResponse> {
    try {
      // Validate that the code is not empty
      if (!code || code.trim() === '') {
        console.error('Empty verification code provided to changePassword');
        return {
          code: 400,
          message: 'Verification code is required'
        };
      }

      let response;
      
      if (this.proxyEnabled) {
        console.log('Using proxy API route for password change with code:', code);
        response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            changeCode: code,
            password: newPassword 
          }),
        });
      } else {
        // Make sure code is properly encoded in the URL
        const url = `${this.baseUrl}${apiConfig.endpoints.resetPassword}?em=${encodeURIComponent(email)}&change_code=${encodeURIComponent(code)}&pass=${encodeURIComponent(newPassword)}`;
        console.log('Password change URL:', url);
        response = await fetch(url);
      }
      
      const data = await response.json();
      
      return {
        code: data.code || 500,
        message: data.msg || data.message || 'Unknown response'
      };
    } catch (error) {
      console.error('Change password API error:', error);
      return { code: 500, message: 'Service error occurred' };
    }
  }

  /**
   * Запрос на генерацию изображения через прокси-сервер
   * @param params Параметры для генерации изображения и данные пользователя
   * @returns Результат генерации изображения
   */
  async generateImage(params: {
    prompt: string;
    style_preset?: string;
    output_format?: string;
    em: string;
    pass: string;
    uid?: string;
  }): Promise<GenerateImageResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Используем Next.js API route для обхода CORS
        console.log('Using proxy API route for image generation');
        response = await fetch('/api_generate.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Proxy API route returned status ${response.status}: ${errorText}`);
          // Fallback к прямому API вызову
          this.proxyEnabled = false;
          return this.generateImage(params);
        }
      } else {
        // Прямой вызов API (будут проблемы с CORS в браузере)
        console.log('Using direct API call for image generation');
        response = await fetch(`${this.baseUrl}${apiConfig.endpoints.generateImage}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Generate image API error:', error);
      return { 
        status: 'error', 
        message: 'Service error occurred',
        code: 500
      };
    }
  }

  /**
   * Получение списка изображений пользователя
   * @param email Email пользователя
   * @param password Пароль пользователя
   * @returns Список изображений пользователя
   */
  async getUserImages(email: string, password: string): Promise<UserImagesResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Используем Next.js API route для обхода CORS
        console.log('Using proxy API route for getting user images');
        response = await fetch('/api/user-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Proxy API route returned status ${response.status}: ${errorText}`);
          // Fallback к прямому API вызову
          this.proxyEnabled = false;
          return this.getUserImages(email, password);
        }
      } else {
        // Прямой вызов API (будут проблемы с CORS в браузере)
        console.log('Using direct API call for getting user images');
        response = await fetch(`${this.baseUrl}${apiConfig.endpoints.userImages}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            em: email, 
            pass: password,
            action: 'list' 
          }),
        });
      }
      
      const data = await response.json();
      
      // Нормализуем формат ответа
      return {
        status: data.status || (data.code >= 200 && data.code < 300 ? 'ok' : 'error'),
        images: data.images || [],
        message: data.message || data.msg || '',
        code: data.code || 500
      };
    } catch (error) {
      console.error('Get user images API error:', error);
      return { 
        status: 'error', 
        message: 'Service error occurred',
        code: 500,
        images: []
      };
    }
  }

  /**
   * Проверка статуса подписки пользователя
   * @param email Email пользователя
   * @param password Пароль пользователя
   * @returns Информация о подписке
   */
  async checkSubscription(email: string, password: string): Promise<SubscriptionResponse> {
    try {
      // Используем метод login, который уже возвращает информацию о подписке
      const loginResponse = await this.login(email, password);
      
      return {
        status: loginResponse.code >= 200 && loginResponse.code < 300 ? 'ok' : 'error',
        is_subscribed: loginResponse.timestamp !== undefined && loginResponse.timestamp > Math.floor(Date.now() / 1000),
        subscription_end: loginResponse.timestamp || 0,
        message: loginResponse.message || '',
        code: loginResponse.code
      };
    } catch (error) {
      console.error('Check subscription API error:', error);
      return { 
        status: 'error', 
        message: 'Service error occurred',
        code: 500,
        is_subscribed: false,
        subscription_end: 0
      };
    }
  }
}

export interface ApiResponse {
  code: number;
  message?: string;
  log?: string;
  userId?: number;
  sub?: string;
  timestamp?: number;
  verify?: number;
  [key: string]: any;
}

// Create and export default instance
const apiClient = new ApiClient();
export default apiClient;
