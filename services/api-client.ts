import apiConfig from '../config/api-config';
import endpointsConfig from '../config/endpoints-config';
import { ApiImagesResponse, GeneratedImage } from './ai_gen.service';
import {
  BaseResponse,
  GenerateImageResponse,
  UserImagesResponse,
  SubscriptionResponse
} from './types/api-responses';

export class ApiClient {
  private baseUrl: string;
  private proxyEnabled: boolean;
  private useRelativePaths: boolean;

  constructor(baseUrl: string = apiConfig.domain, proxyEnabled: boolean = apiConfig.proxyEnabled, useRelativePaths: boolean = true) {
    this.baseUrl = baseUrl;
    this.proxyEnabled = false;
    this.useRelativePaths = useRelativePaths;
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

  public enableRelativePaths(enabled: boolean): void {
    this.useRelativePaths = enabled;
  }

  private getApiUrl(endpoint: string): string {
    if (this.useRelativePaths) {
      // If using relative paths, return just the endpoint path
      return endpoint;
    } else {
      // Otherwise, use the full URL with baseUrl
      return `${this.baseUrl}${endpoint}`;
    }
  }

  /**
   * Authentication: User login
   * @param email User email
   * @param password User password
   * @returns API response
   */
  async login(email: string, password: string): Promise<any> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Using proxy (POST method)
        response = await fetch(endpointsConfig.auth.proxy.login, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
      } else {
        // Direct API call - Updated to use POST method to match documentation
        const apiUrl = this.getApiUrl(apiConfig.endpoints.login);
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            em: email,
            pass: password
          })
        });
      }
      
      return await response.json();
    } catch (error) {
      console.error("Login error:", error);
      return { code: 500, message: "Service error" };
    }
  }

  /**
   * Authentication: User registration
   * @param email User email
   * @param password User password
   * @returns API response
   */
  async register(email: string, password: string): Promise<any> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Using proxy (POST method)
        response = await fetch(endpointsConfig.auth.proxy.register, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
      } else {
        // Direct API call - Updated to use POST method to match documentation
        const apiUrl = this.getApiUrl(apiConfig.endpoints.register);
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            em: email,
            pass: password
          })
        });
      }
      
      return await response.json();
    } catch (error) {
      console.error("Registration error:", error);
      return { code: 500, message: "Service error" };
    }
  }

  /**
   * Password reset: Request reset code
   * @param email User email
   * @returns API response
   */
  async requestPasswordReset(email: string): Promise<any> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Using proxy (POST method)
        response = await fetch(endpointsConfig.auth.proxy.resetPassword, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
      } else {
        // Direct API call - Updated to use POST method to match documentation
        const apiUrl = this.getApiUrl(apiConfig.endpoints.resetPassword);
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            em: email
          })
        });
      }
      
      return await response.json();
    } catch (error) {
      console.error("Password reset request error:", error);
      return { code: 500, message: "Service error" };
    }
  }

  /**
   * Password reset: Verify reset code
   * @param email User email
   * @param code Reset code to verify
   * @returns API response
   */
  async verifyResetCode(email: string, code: string): Promise<any> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Using proxy (POST method)
        response = await fetch(endpointsConfig.auth.proxy.resetPassword, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, check_code: code })
        });
      } else {
        // Direct API call - Updated to use POST method to match documentation
        const apiUrl = this.getApiUrl(apiConfig.endpoints.resetPassword);
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            em: email,
            check_code: code
          })
        });
      }
      
      return await response.json();
    } catch (error) {
      console.error("Verify reset code error:", error);
      return { code: 500, message: "Service error" };
    }
  }

  /**
   * Password reset: Change password with verified reset code
   * @param email User email
   * @param code Verified reset code
   * @param newPassword New password
   * @returns API response
   */
  async changePassword(email: string, code: string, newPassword: string): Promise<any> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Using proxy (POST method)
        response = await fetch(endpointsConfig.auth.proxy.resetPassword, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, check_code: code, pass: newPassword })
        });
      } else {
        // Direct API call - Updated to use POST method to match documentation
        const apiUrl = this.getApiUrl(apiConfig.endpoints.resetPassword);
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            em: email,
            check_code: code,
            pass: newPassword
          })
        });
      }
      
      return await response.json();
    } catch (error) {
      console.error("Change password error:", error);
      return { code: 500, message: "Service error" };
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
  }): Promise<GeneratedImage> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        // Используем Next.js API route для обхода CORS
        console.log('Using proxy API route for image generation');
        response = await fetch(endpointsConfig.imageGeneration.proxy.generate, {
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
        const apiUrl = this.getApiUrl(`${apiConfig.endpoints.generateImage}`);
        response = await fetch(apiUrl, {
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
      throw new Error('Service error occurred');
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
        response = await fetch(endpointsConfig.imageGeneration.proxy.userImages, {
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
        const apiUrl = this.getApiUrl(`${apiConfig.endpoints.userImages}`);
        response = await fetch(apiUrl, {
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

  /**
   * Activates user subscription
   * @param email User email
   * @param password User password
   * @returns Activation status
   */
  async activateSubscription(email: string, password: string): Promise<ApiResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        response = await fetch(endpointsConfig.subscription.proxy.activate, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password }),
        });
      } else {
        // This would be the direct API call if we're not using a proxy
        const apiUrl = this.getApiUrl(`${apiConfig.endpoints.subscription}?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}&action=activate`);
        response = await fetch(apiUrl);
      }
      
      const data = await response.json();
      
      return {
        code: data.code || 500,
        message: data.msg || data.message || 'Unknown response',
        timestamp: data.timestamp || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // Default 30 days if not specified
      };
    } catch (error) {
      console.error('Activate subscription API error:', error);
      return { code: 500, message: 'Service error occurred' };
    }
  }

  /**
   * Deactivates user subscription
   * @param email User email
   * @param password User password
   * @returns Deactivation status
   */
  async deactivateSubscription(email: string, password: string): Promise<ApiResponse> {
    try {
      let response;
      
      if (this.proxyEnabled) {
        response = await fetch(endpointsConfig.subscription.proxy.deactivate, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password }),
        });
      } else {
        // This would be the direct API call if we're not using a proxy
        const apiUrl = this.getApiUrl(`${apiConfig.endpoints.subscription}?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}&action=deactivate`);
        response = await fetch(apiUrl);
      }
      
      const data = await response.json();
      
      return {
        code: data.code || 500,
        message: data.msg || data.message || 'Unknown response'
      };
    } catch (error) {
      console.error('Deactivate subscription API error:', error);
      return { code: 500, message: 'Service error occurred' };
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
apiClient.enableProxy(false); // Disable proxy by default
export default apiClient;
