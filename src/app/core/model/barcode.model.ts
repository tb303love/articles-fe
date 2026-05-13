export interface InventoryUpdate {
  barcode: string;
  quantity: number;
  expiryDate?: string; // ISO format ili null
}
