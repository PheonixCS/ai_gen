export * from './base-response';
export * from './generate-image-response';
export * from './user-images-response';
export * from './subscription-response';

// Base response interface that all API responses should follow
export interface BaseResponse {
  code: number;
  message?: string;
  msg?: string;
}

// Response for image generation
export interface GenerateImageResponse extends BaseResponse {
  status: string;
  image_id?: string;
  image_url: string;
  prompt?: string;
  style?: string;
  format?: string;
  created?: number;
  is_subscribed?: boolean;
  image_count?: number;
}

// Response for user's image history
export interface UserImagesResponse extends BaseResponse {
  status: string;
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

// Response for subscription status check
export interface SubscriptionResponse extends BaseResponse {
  status: string;
  is_subscribed: boolean;
  subscription_end: number;
}

// Response for login/authentication
export interface AuthResponse extends BaseResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
    is_admin: boolean;
    created_at: string;
    subscribed: boolean;
    image_generation_limit: number;
  };
}

// Response for registration
export interface RegisterResponse extends AuthResponse {}

// Response for password reset
export interface PasswordResetResponse extends BaseResponse {}