/**
 * Configuration for API connections
 * Based on the API documentation
 */
const apiConfig = {
  // Base domain for API calls
  domain: process.env.NEXT_PUBLIC_API_URL || 'https://api.aiphotogen.com',
  clearDomain: 'https://api.aiphotogen.com',
  NODE_ENV: "production", // Set to 'production' in production environment
  // Use proxy endpoints through Next.js API routes to avoid CORS issues
  proxyEnabled: true,
  // appId: "test.app1",
  appId: "imageni.org",
  
  // API endpoints based on documentation
  endpoints: {
    register: '/api/auth/reg.php',
    login: '/api/auth/login.php',
    resetPassword: '/api/auth/reset.php',
    generateImage: '/api/img/img.php',
    userImages: '/api/img/history.php',
    subscription: '/api/subscribe/manage.php'
  },

  // Style presets for image generation
  stylePresets: [
    '3d-model',
    'analog-film',
    'anime',
    'comic-book',
    'digital-art',
    'enhance',
    'fantasy-art',
    'isometric',
    'line-art',
    'low-poly',
    'modeling-compound',
    'neon-punk',
    'origami',
    'photographic',
    'pixel-art',
    'tile-texture'
  ],

  // Output formats for generated images
  outputFormats: [
    'webp',
    'jpeg',
    'png'
  ],

  // Available aspect ratios
  aspectRatios: [
    '1:1',
    '4:3',
    '16:9',
    '3:4',
    '9:16'
  ]
};

export default apiConfig;