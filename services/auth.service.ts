import apiClient from './api-client';
import JwtUtils from './jwt.utils';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: any;
  token?: string;
}

export interface User {
  email: string;
  userId?: number;
  token?: string;
  // Добавляем поле для хранения пароля в открытом виде
  password?: string;
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

  public isAuthenticated(): boolean {
    // Check if user exists and token is valid
    if (!this.user || !this.user.token) {
      return false;
    }
    
    // Verify token validity
    const payload = JwtUtils.verifyToken(this.user.token);
    return payload !== null;
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public getToken(): string | null {
    return this.user?.token || null;
  }

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

  // Request password reset - sends a verification code to the email
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
        case 105:
          return { success: false, message: 'Ошибка отправки письма на указанный email' };
        case 199:
          return { success: false, message: 'Код подтверждения уже был отправлен. Проверьте почту или попробуйте позже' };
        default:
          return { success: false, message: 'Произошла ошибка при запросе сброса пароля' };
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'Произошла ошибка при соединении с сервером' };
    }
  }

  // Verify the code sent to email
  async verifyCode(email: string, code: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.verifyResetCode(email, code);
      
      // Handle API response codes
      switch (response.code) {
        case 150:
          return { 
            success: true, 
            message: 'Код подтверждения верный',
            data: { email }
          };
        case 10:
          return { success: false, message: 'Время действия кода истекло. Запросите новый код' };
        case 99:
          return { success: false, message: 'Неверный код подтверждения' };
        default:
          return { success: false, message: 'Произошла ошибка при проверке кода' };
      }
    } catch (error) {
      console.error('Code verification error:', error);
      return { success: false, message: 'Произошла ошибка при соединении с сервером' };
    }
  }

  // Reset the password with new password
  async resetPassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
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

  // -- Registration flow methods --

  // Step 1: Initiate registration with email and password
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
  
  // Step 2: Send verification code - this is a step we add in the app before completing registration
  async sendVerificationCode(email: string): Promise<AuthResponse> {
    console.log(`Sending verification code to ${email}`);
    
    // In a real implementation, we might call an API to send a verification code
    // For now, we'll generate a code locally
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCodes[email] = verificationCode;
    
    console.log(`Verification code for ${email}: ${verificationCode}`);
    
    return { 
      success: true, 
      message: 'Код подтверждения отправлен на вашу почту',
      data: { email }
    };
  }
  
  // Step 3: Complete registration by verifying the code and registering the user
  async completeRegistration(email: string, code: string): Promise<AuthResponse> {
    console.log(`Completing registration for ${email} with code ${code}`);
    
    // For skip verification mode - bypass verification check
    const skipVerification = code === "000000";
    
    // Check the verification code unless we're skipping verification
    if (!skipVerification && (!this.verificationCodes[email] || this.verificationCodes[email] !== code)) {
      return { success: false, message: 'Неверный код подтверждения' };
    }
    
    try {
      const pendingRegistration = this.pendingRegistrations[email];
      
      if (!pendingRegistration) {
        return { success: false, message: 'Регистрация не была начата' };
      }
      
      // Call the register API
      const response = await apiClient.register(email, pendingRegistration.password);
      
      // Handle API response codes
      switch (response.code) {
        case 200:
          // Clean up
          delete this.verificationCodes[email];
          delete this.pendingRegistrations[email];
          
          // Сохраняем пользователя вместе с паролем в открытом виде
          this.user = { 
            email,
            password: pendingRegistration.password 
          };
          this.saveUserToStorage(this.user);
          
          return { 
            success: true, 
            message: 'Регистрация успешно завершена',
            data: { email }
          };
        case 0:
          return { success: false, message: 'Произошла стандартная ошибка' };
        case 1:
          return { success: false, message: 'Не введены email или пароль' };
        case 81:
          return { success: false, message: 'Неверный пароль' };
        case 82:
          return { success: false, message: 'Пользователь с таким email уже существует' };
        case 83:
          return { success: false, message: 'Некорректный email' };
        case 85:
          return { success: false, message: 'Превышено число попыток регистрации с вашего устройства' };
        case 500:
          return { success: false, message: 'Сервисная ошибка. Пожалуйста, попробуйте позже' };
        default:
          return { success: false, message: 'Произошла неизвестная ошибка при регистрации' };
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      return { success: false, message: 'Произошла ошибка при соединении с сервером' };
    }
  }
  
  // Login method
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log(`Attempting to login with email: ${email}`);
      const response = await apiClient.login(email, password);
      console.log('Raw login API response:', response);
      
      // Handle API response codes
      if (response.code === 200) {
        // Successfully logged in
        const userId = response.userId || 0;
        const sub = response.sub || email;
        
        // Generate JWT token
        const token = JwtUtils.generateToken({
          userId,
          email,
          sub
        });
        
        // Store user info with token and password in plaintext
        this.user = { 
          email, 
          userId, 
          token,
          password // Сохраняем пароль в открытом виде
        };
        
        // Явно сохраняем пользователя в localStorage
        this.saveUserToStorage(this.user);
        
        // Проверим, что данные действительно сохранились
        console.log('User saved to storage, current localStorage:', 
          typeof window !== 'undefined' ? 'Data saved' : 'Not available');
        
        return { 
          success: true, 
          message: 'Вход выполнен успешно',
          data: { email, userId },
          token
        };
      } else {
        // Handle error codes
        console.log('Login failed with code:', response.code);
        switch (response.code) {
          case 0:
            return { success: false, message: 'Произошла стандартная ошибка' };
          case 1:
            return { success: false, message: 'Не введены email или пароль' };
          case 80:
            return { success: false, message: 'Пользователь не найден' };
          case 81:
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