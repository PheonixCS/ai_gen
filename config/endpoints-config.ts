/**
 * Configuration for API endpoints
 * These endpoints are based on the API documentation
 */
const endpointsConfig = {
  auth: {
    proxy: {
      register: '/api/proxy/auth/register',
      login: '/api/proxy/auth/login',
      resetPassword: '/api/proxy/auth/reset-password'
    },
    direct: {
      register: '/api/auth/reg.php',
      login: '/api/auth/login.php',
      resetPassword: '/api/auth/reset.php'
    }
  },
  imageGeneration: {
    proxy: {
      generate: '/api/proxy/img/generate',
      userImages: '/api/proxy/img/history'
    },
    direct: {
      generate: '/api/img/img.php',
      userImages: '/api/img/history.php'
    }
  },
  subscription: {
    proxy: {
      activate: '/api/proxy/subscribe/activate',
      deactivate: '/api/proxy/subscribe/deactivate',
      status: '/api/proxy/subscribe/status'
    },
    direct: {
      manage: '/api/subscribe/manage.php'
    }
  }
};

export default endpointsConfig;
