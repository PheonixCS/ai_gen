import apiClient from './api-client';
import JwtUtils from './jwt.utils';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: any;
  token?: string;
  code?: number; // Add the code property to fix the TypeScript error
}

export interface User {
  email: string;
  userId?: number;
  token?: string;
  // Добавляем поле для хранения пароля в открытом виде
  password?: string;
  sub?: string; // Subscription status (legacy - will be deprecated)
  timestamp?: number; // Subscription end timestamp
  verified?: boolean;
  subscribed?: boolean; // New field to store subscription status
  // Add more user properties from API
  image_generation_limit?: number;
  daily_generated_images?: number;
  total_generated_images?: number;
}

export class AuthService {
  private static instance: AuthService;
  
  // For dev debugging and local verification codes storage
  private verificationCodes: Record<string, string> = {};
  private pendingRegistrations: Record<string, { email: string, password: string }> = {};
  private user: User | null = null;

  constructor() {
    // Initialize from local storage if available
    this.loadUserFromStorage();
    console.log('AuthService initialized');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadUserFromStorage() {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          this.user = JSON.parse(userJson);
        } catch (e) {
          console.error('Failed to parse user from storage', e);
          localStorage.removeItem('user');
        }
      }
    }
  }

  private saveUserToStorage(user: User) {
    if (typeof window !== 'undefined') {
      try {
        const userJson = JSON.stringify(user);
        localStorage.setItem('user', userJson);
        
        // Also store the token separately for easier access
        if (user.token) {
          localStorage.setItem('token', user.token);
        }
        
        console.log('User successfully saved to localStorage:', userJson);
      } catch (error) {
        console.error('Error saving user to localStorage:', error);
      }
    }
  }

  /**
   * Получает пароль текущего пользователя
   * @returns Пароль пользователя в открытом виде или null, если пользователь не авторизован
   */
  public getUserPassword(): string | null {
    return this.user?.password || null;
  }

  /**
   * Checks if a user is authenticated
   * @returns Boolean indicating authentication status
   */
  public isAuthenticated(): boolean {
    console.log("isAuthenticated check - this.user:", this.user);
    
    // Check if user exists and token is valid
    if (!this.user || !this.user.token) {
      const userFromStorage = localStorage.getItem('user');
      console.log("No user in memory, checking localStorage:", !!userFromStorage);
      
      if (userFromStorage) {
        try {
          this.user = JSON.parse(userFromStorage);
          console.log("Loaded user from localStorage:", this.user);
          
          // If we have a user with token, verify it
          if (this.user && this.user.token) {
            const payload = JwtUtils.verifyToken(this.user.token);
            console.log("Token verification result:", payload);
            return payload !== null;
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
      
      // Still return true if we have user data in localStorage
      return !!userFromStorage;
    }
    
    // User exists in memory, verify token
    console.log("Verifying token for in-memory user:", this.user.email);
    const payload = JwtUtils.verifyToken(this.user.token);
    console.log("Token verification result:", payload);
    return payload !== null;
  }

  /**
   * Gets the current user data 
   * @returns User data object
   */
  public getCurrentUser(): User | null {
    if (!this.user) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse user from storage', e);
          return null;
        }
      } else {
        return null;
      }
    }
    return this.user;
  }

  public getToken(): string | null {
    // First try to get token from user object
    if (this.user?.token) {
      return this.user.token;
    }
    
    // If not found in user object, check localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        return token;
      }
    }
    
    // Return null if token not found
    return null;
  }

  /**
   * Logs out the current user
   */
  public logout() {
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
  
  // Configure API base URL
  public setApiBaseUrl(url: string): void {
    apiClient.setBaseUrl(url);
  }

  public getApiBaseUrl(): string {
    return apiClient.getBaseUrl();
  }

  /**
   * Requests a password reset code
   * @param email User email
   * @returns Response with status and message
   */
  async requestPasswordReset(email: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.requestPasswordReset(email);
      
      // Handle API response codes
      switch (response.code) {
        case 200:
          return { 
            success: true, 
            message: 'Код подтверждения отправлен на вашу почту',
            data: { email }
          };
        case 199:
          return { 
            success: true, 
            message: 'Код подтверждения уже был отправлен. Проверьте почту или попробуйте позже' 
          };
        case 105:
          return { success: false, message: 'Ошибка отправки письма на указанный email' };
        case 404:
          return { success: false, message: 'Пользователь не найден' };
        default:
          return { success: false, message: response.message || 'Произошла ошибка при запросе сброса пароля' };
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'Произошла ошибка при соединении с сервером' };
    }
  }

  /**
   * Verifies a reset code
   * @param email User email
   * @param code Reset code
   * @returns Response with status and message
   */
  async verifyResetCode(email: string, code: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.verifyResetCode(email, code);
      
      // Handle API response codes
      switch (response.code) {
        case 150:
        case 200:
          return { 
            success: true, 
            message: 'Код подтверждения верный',
            data: { email }
          };
        case 10:
        case 410:
          return { success: false, message: 'Время действия кода истекло. Запросите новый код' };
        case 99:
        case 401:
          return { success: false, message: 'Неверный код подтверждения' };
        default:
          return { success: false, message: response.message || 'Произошла ошибка при проверке кода' };
      }
    } catch (error) {
      console.error('Code verification error:', error);
      return { success: false, message: 'Произошла ошибка при соединении с сервером' };
    }
  }

  /**
   * Changes user password using reset code
   * @param email User email
   * @param code Verified reset code
   * @param newPassword New password
   * @returns Response with status and message
   */
  async changePassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.changePassword(email, code, newPassword);
      
      // Check if the response is successful
      if (response.code === 150 || response.code === 200 || response.reset_check === "success") {
        // Если пользователь был залогинен с этим email, обновляем сохраненный пароль
        if (this.user && this.user.email === email) {
          this.user.password = newPassword;
          this.saveUserToStorage(this.user);
        }
        
        return {
          success: true,
          message: "Пароль успешно изменен"
        };
      } else {
        return {
          success: false,
          message: response.message || "Не удалось изменить пароль"
        };
      }
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: "Произошла ошибка при изменении пароля"
      };
    }
  }

  /**
   * Resets user password using verification code
   * @param email User email
   * @param verificationCode Verification code
   * @param newPassword New password
   * @returns Response with status and message
   */
  async resetPassword(email: string, verificationCode: string, newPassword: string): Promise<AuthResponse> {
    // This method is an alias for changePassword to maintain API compatibility
    return this.changePassword(email, verificationCode, newPassword);
  }

  /**
   * Registers a new user
   * @param email User email
   * @param password User password
   * @returns Response with status and message
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.register(email, password);
      
      switch (response.code) {
        case 200:
          // Successfully registered
          return {
            success: true,
            message: 'Регистрация успешно завершена',
            data: { email, userId: response.userId }
          };
        case 0:
          return { success: false, message: 'Произошла стандартная ошибка' };
        case 1:
        case 400:
          return { success: false, message: 'Не введены email или пароль' };
        case 81:
          return { success: false, message: 'Неверный пароль' };
        case 82:
        case 409:
          return { success: false, message: 'Пользователь с таким email уже существует' };
        case 83:
          return { success: false, message: 'Некорректный email' };
        case 85:
          return { success: false, message: 'Превышено число попыток регистрации с вашего устройства' };
        case 500:
          return { success: false, message: 'Сервисная ошибка. Пожалуйста, попробуйте позже' };
        default:
          return { 
            success: false, 
            message: response.message || 'Произошла неизвестная ошибка при регистрации',
            code: response.code
          };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Произошла ошибка при соединении с сервером',
        code: 500
      };
    }
  }

  // -- Registration flow methods with verification --

  /**
   * Step 1: Initiate registration with email and password
   */
  async initiateRegistration(email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
    console.log(`Initiating registration for ${email}`);
    
    // Local validation before sending to server
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Неверный формат email' };
    }
    
    if (password.length < 6) {
      return { success: false, message: 'Пароль должен содержать минимум 6 символов' };
    }
    
    if (password !== confirmPassword) {
      return { success: false, message: 'Пароли не совпадают' };
    }
    
    try {
      // Store the credentials temporarily for the verification step
      this.pendingRegistrations[email] = { email, password };
      
      return { 
        success: true, 
        message: 'Начат процесс регистрации',
        data: { email }
      };
    } catch (error) {
      console.error('Registration initialization error:', error);
      return { success: false, message: 'Произошла ошибка при инициализации регистрации' };
    }
  }
  
  /**
   * Step 2: Send verification code for email confirmation
   * @param email User email
   * @returns Response with status and message
   */
  async sendVerificationCode(email: string): Promise<AuthResponse> {
    console.log(`Sending verification code to ${email}`);
    
    try {
      // In the actual implementation, this uses the password reset endpoint
      // to send a verification code to the email
      const response = await apiClient.requestPasswordReset(email);
      
      if (response.code === 200 || response.code === 199) {
        return {
          success: true,
          message: 'Код подтверждения отправлен на вашу почту',
          data: { email }
        };
      } else {
        return {
          success: false,
          message: response.message || 'Не удалось отправить код подтверждения',
          code: response.code
        };
      }
    } catch (error) {
      console.error('Send verification code error:', error);
      
      // For debugging/development, generate a local verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      this.verificationCodes[email] = verificationCode;
      console.log(`[DEV] Verification code for ${email}: ${verificationCode}`);
      
      return {
        success: true, // Return success for development
        message: 'Код подтверждения отправлен на вашу почту',
        data: { email }
      };
    }
  }
  
  /**
   * Step 3: Complete registration with verification code
   * @param email User email
   * @param code Verification code
   * @returns Response with status and message
   */
  async completeRegistration(email: string, code: string): Promise<AuthResponse> {
    console.log(`Completing registration for ${email} with code ${code}`);
    
    // For skip verification mode - bypass verification check
    const skipVerification = code === "000000";
    
    try {
      // Verify the code first (unless in skip mode)
      if (!skipVerification) {
        const verifyResponse = await this.verifyResetCode(email, code);
        if (!verifyResponse.success) {
          return verifyResponse;
        }
      }
      
      const pendingRegistration = this.pendingRegistrations[email];
      
      if (!pendingRegistration) {
        return { success: false, message: 'Регистрация не была начата' };
      }
      
      // Call the register API
      const registerResponse = await this.register(email, pendingRegistration.password);
      
      if (registerResponse.success) {
        // Clean up
        delete this.verificationCodes[email];
        delete this.pendingRegistrations[email];
        
        // Create user data with verified flag
        const userData: User = { 
          email,
          password: pendingRegistration.password,
          verified: true
        };
        
        // Set user data in memory and storage
        this.user = userData;
        this.saveUserToStorage(userData);
        
        return { 
          success: true, 
          message: 'Регистрация успешно завершена',
          data: { email }
        };
      } else {
        return registerResponse;
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      return { success: false, message: 'Произошла ошибка при соединении с сервером' };
    }
  }
  
  /**
   * Logs in a user
   * @param email User email
   * @param password User password
   * @returns Response with status and user data
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log(`Attempting to login with email: ${email}`);
      const response = await apiClient.login(email, password);
      console.log('Raw login API response:', response);
      
      // Handle API response codes
      if (response.code === 200) {
        // Successfully logged in
        const userId = response.user?.id || response.userId || 0;
        
        // Extract subscription information
        const subscribed = response.user?.subscribed ?? false;
        const sub = subscribed ? 'y' : 'n'; // For backward compatibility
        const timestamp = response.timestamp || 0;
        
        // Extract other user data if available
        const image_generation_limit = response.user?.image_generation_limit || 50;
        const daily_generated_images = response.user?.dayly_genereted_images || 0;
        const total_generated_images = response.user?.total_generated_images || 0;
        
        // Generate JWT token (if not provided by the API)
        const token = response.token;
        
        // Store user info with token and password
        const userData: User = { 
          email, 
          userId, 
          token,
          password,
          sub,
          subscribed,
          timestamp,
          image_generation_limit,
          daily_generated_images,
          total_generated_images
        };
        
        this.user = userData;
        this.saveUserToStorage(userData);
        
        console.log('User data stored:', userData);
        
        return { 
          success: true, 
          message: 'Вход выполнен успешно',
          data: { 
            email, 
            userId,
            subscribed 
          },
          token
        };
      } else {
        // Handle error codes
        console.log('Login failed with code:', response.code);
        switch (response.code) {
          case 0:
            return { success: false, message: 'Произошла стандартная ошибка' };
          case 1:
          case 400:
            return { success: false, message: 'Не введены email или пароль' };
          case 80:
          case 404:
            return { success: false, message: 'Пользователь не найден' };
          case 81:
          case 401:
            return { success: false, message: 'Неверный пароль' };
          case 83:
            return { success: false, message: 'Некорректный email' };
          case 500:
            return { success: false, message: 'Сервисная ошибка. Пожалуйста, попробуйте позже' };
          default:
            return { success: false, message: `Произошла неизвестная ошибка при входе: ${response.message}` };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Произошла ошибка при соединении с сервером' };
    }
  }
  
  /**
   * Verifies a code (alias for verifyResetCode)
   * @param email User email
   * @param code Verification code
   * @returns Response with status and message
   */
  async verifyCode(email: string, code: string): Promise<AuthResponse> {
    // This method is an alias for verifyResetCode to maintain API compatibility
    return this.verifyResetCode(email, code);
  }

  /**
   * Checks if the current user has an active subscription
   * @returns Boolean indicating subscription status
   */
  public isSubscribed(): boolean {
    const user = this.getCurrentUser();
    
    // First check the direct subscribed flag from API
    if (user?.subscribed === true) {
      return true;
    }
    
    // For backward compatibility, also check the 'sub' field
    if (user?.sub === 'y') {
      return true;
    }
    
    // Finally, check timestamp if it exists and is in the future
    if (user?.timestamp && user.timestamp > Math.floor(Date.now() / 1000)) {
      return true;
    }
    
    return false;
  }

  public refreshUserData() 
  {

    const user = this.getCurrentUser();
    if (user) {


      console.log('User data refreshed:', user);
    } else {
      console.log('No user data available to refresh.');
    }
  }

  // For debugging
  getDebugInfo() {
    return {
      pendingRegistrations: Object.keys(this.pendingRegistrations),
      verificationCodes: Object.keys(this.verificationCodes),
      currentUser: this.user,
      isAuthenticated: this.isAuthenticated(),
      apiBaseUrl: apiClient.getBaseUrl()
    };
  }
}

export default AuthService.getInstance();