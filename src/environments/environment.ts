export const environment = {
  production: false,
  apiUrl: '/api',      // Više ne treba https://localhost:8443
  imageBaseUrl: '/images',
  websocketConfig: {
    brokerURL:'ws://localhost:4200/ws-barcode',
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  }
};
