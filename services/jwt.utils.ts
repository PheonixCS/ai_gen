/**
 * Simple JWT implementation for client-side authentication
 */
export interface JwtPayload {
  userId: number;
  email: string;
  exp: number;
  sub: string;
  iat: number;
}

export class JwtUtils {
  private static SECRET_KEY = 'ai-photo-gen-jwt-secret'; // In a real app, this would be an environment variable

  /**
   * Generate a JWT token
   * @param payload The data to encode in the token
   * @returns The JWT token string
   */
  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    // Add issued at and expiration time
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 6 * 60 * 60; // 6 hours
    const fullPayload = {
      ...payload,
      iat: now,
      exp: exp
    };

    // Create JWT parts
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    
    const signature = this.createSignature(encodedHeader, encodedPayload);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode a JWT token
   * @param token The JWT token to verify and decode
   * @returns The decoded payload if valid, null otherwise
   */
  static verifyToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [encodedHeader, encodedPayload, signature] = parts;
      const expectedSignature = this.createSignature(encodedHeader, encodedPayload);
      
      // Verify signature
      if (signature !== expectedSignature) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JwtPayload;
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  private static base64UrlEncode(str: string): string {
    // Convert string to base64 and make it URL safe
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private static base64UrlDecode(str: string): string {
    // Add padding if needed
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  private static createSignature(encodedHeader: string, encodedPayload: string): string {
    // In a client-side implementation, we use a simple hashing method
    // In a production app, this would use a proper HMAC function
    const data = `${encodedHeader}.${encodedPayload}`;
    const hash = this.simpleHash(data + this.SECRET_KEY);
    return this.base64UrlEncode(hash);
  }

  private static simpleHash(str: string): string {
    // Simple hash function for demo purposes
    // In production, use a proper crypto library
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

export default JwtUtils;
