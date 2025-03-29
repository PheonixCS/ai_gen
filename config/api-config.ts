/**
 * API Configuration for the application
 * This allows changing the API domain as needed
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV !== 'production';

// Default API domains
const PRODUCTION_API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN || 'https://imageni.org';
const DEVELOPMENT_API_DOMAIN = process.env.NEXT_PUBLIC_DEV_API_DOMAIN || 'https://krazu-group.tech/imageni_clean';

// Select the appropriate domain based on environment
const API_DOMAIN = isDevelopment ? DEVELOPMENT_API_DOMAIN : PRODUCTION_API_DOMAIN;

const config = {
  domain: API_DOMAIN,
  isDevelopment,
  proxyEnabled: isDevelopment ? true : process.env.NEXT_PUBLIC_USE_PROXY === 'true',
  endpoints: {
    login: '/api_log.php',
    register: '/api_reg.php',
    resetPassword: '/api_reset.php',
    generateImage: '/api_generate.php',
    userImages: '/api_img.php'
  }
};

export default config;