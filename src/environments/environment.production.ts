export const environment = {
  production: true,
  // Relativna putanja jer Angular "živi" na istom hostu kao i Spring
  apiUrl: '/api',
  // Isto važi i za slike
  imageBaseUrl: '/images',
  websocketConfig: {
    brokerURL: 'ws://localhost:8080/ws-barcode',
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  }
};
