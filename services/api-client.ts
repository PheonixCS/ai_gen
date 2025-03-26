export class ApiClient {
  private baseUrl: string;
  private proxyEnabled: boolean;

  constructor(baseUrl: string = 'http://193.188.23.43/imageni_clean', proxyEnabled: boolean = true) {
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
        response = await fetch(`${this.baseUrl}/api_log.php?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`);
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
        response = await fetch(`${this.baseUrl}/api_reg.php?em=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`);
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
        response = await fetch(`${this.baseUrl}/api_reset.php?em=${encodeURIComponent(email)}`);
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
        response = await fetch(`${this.baseUrl}/api_reset.php?em=${encodeURIComponent(email)}&check_code=${encodeURIComponent(code)}`);
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
        const url = `${this.baseUrl}/api_reset.php?em=${encodeURIComponent(email)}&change_code=${encodeURIComponent(code)}&pass=${encodeURIComponent(newPassword)}`;
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
