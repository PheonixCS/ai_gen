/**
 * API Configuration for the application
 * This allows changing the API domain as needed
 */

// Default API domain
const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN || 'https://imageni.org';

export default {
  domain: API_DOMAIN,
  endpoints: {
    login: '/api_log.php',
    register: '/api_reg.php',
    resetPassword: '/api_reset.php'
  }
};
