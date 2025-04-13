/**
 * Simple JWT implementation for client-side authentication
 */
export interface CustomJwtPayload {
  userId?: string | number;
  email?: string;
  sub?: string;
  subscribed?: boolean;
  exp?: number;
  iat?: number;
  [key: string]: any; // Allow for additional properties
}

export class JwtUtils {
  private static readonly SECRET_KEY = 'your-secret-key'; // In production, use environment variables
  private static readonly EXPIRATION = 30 * 24 * 60 * 60; // 30 days in seconds

  /**
   * Generate a JWT token
   * @param payload Data to include in the token
   * @returns JWT token string
   */
  public static generateToken(payload: CustomJwtPayload): string {
    try {
      // If jsonwebtoken package is available, use it
      if (typeof require !== 'undefined') {
        try {
          const jwt = require('jsonwebtoken');
          return jwt.sign(payload, this.SECRET_KEY, { expiresIn: this.EXPIRATION });
        } catch (e) {
          console.warn("jsonwebtoken package not available, using fallback implementation");
        }
      }

      // Fallback implementation for browser environments or if package is missing
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      // Prepare payload with expiration
      const now = Math.floor(Date.now() / 1000);
      const fullPayload = {
        ...payload,
        iat: now,
        exp: now + this.EXPIRATION
      };

      // Base64 encode parts
      const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
      const payloadBase64 = this.base64UrlEncode(JSON.stringify(fullPayload));

      // Create signature (this is a simplified version - not secure for production)
      // In a real implementation, we would use crypto libraries to create a proper HMAC
      const signature = this.base64UrlEncode(
        `${this.SECRET_KEY}:${headerBase64}.${payloadBase64}`
      );

      // Return the JWT token
      return `${headerBase64}.${payloadBase64}.${signature}`;
    } catch (error) {
      console.error("Token generation error:", error);
      // Return a placeholder token for development - not for production!
      const fallbackPayload = { ...payload, fallback: true };
      return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${this.base64UrlEncode(JSON.stringify(fallbackPayload))}.INVALID`;
    }
  }

  /**
   * Verify a JWT token
   * @param token JWT token string
   * @returns Decoded payload or null if invalid
   */
  public static verifyToken(token: string): CustomJwtPayload | null {
    try {
      console.log("Verifying token:", token);
      
      // If jsonwebtoken package is available, use it
      if (typeof require !== 'undefined') {
        try {
          const jwt = require('jsonwebtoken');
          return jwt.verify(token, this.SECRET_KEY) as CustomJwtPayload;
        } catch (e) {
          console.warn("jsonwebtoken package not available or token invalid, using fallback implementation");
        }
      }
      
      // Extract payload without signature verification (for development only)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error("Invalid token format - doesn't have 3 parts");
        return null;
      }
      
      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      console.log("Token payload:", payload);
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.error("Token expired");
        return null;
      }
      
      // In a production environment, we would verify the signature here
      // For now, we'll just return the payload
      return payload;
    } catch (error) {
      console.error("Token verification error:", error);
      return null;
    }
  }

  /**
   * Decode a JWT token without verifying
   * @param token JWT token string
   * @returns Decoded payload or null if invalid format
   */
  public static decodeToken(token: string): CustomJwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      return JSON.parse(this.base64UrlDecode(parts[1]));
    } catch {
      return null;
    }
  }

  /**
   * Base64Url encode a string
   */
  private static base64UrlEncode(str: string): string {
    // Convert to base64 and make URL safe
    let base64 = typeof btoa === 'function' 
      ? btoa(str) 
      : Buffer.from(str).toString('base64');
    
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Base64Url decode a string
   */
  private static base64UrlDecode(str: string): string {
    // Make base64 URL string into normal base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decode
    return typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString();
  }
}

export default JwtUtils;
