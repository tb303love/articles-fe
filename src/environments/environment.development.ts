export const environment = {
  production: false,
  apiUrl: '/api',
  imageBaseUrl: '/images',
  websocketConfig: {
    brokerURL:'ws://localhost:4200/ws-barcode',
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  }
};
