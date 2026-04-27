export const environment = {
  production: true,
  // Relativna putanja jer Angular "živi" na istom hostu kao i Spring
  apiUrl: '/api',
  // Isto važi i za slike
  imageBaseUrl: '/images',
  webSocketUrl: 'wss://localhost:443/ws-barcode'
};
