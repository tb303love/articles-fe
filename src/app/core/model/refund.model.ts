export interface Refund {
  id?: number;
  originalOrderId: number;
  items: RefundItem[];
  totalAmount: number;
  createdAt?: string; // Standardni ISO format sa bekenda
}

export interface RefundItem {
  id?: number;
  articleId: number;   // ID artikla iz Article entiteta
  articleName: string; // Ime artikla za prikaz u listi
  quantity: number;    // Ukupna stornirana količina (1:1 sa originalom)
}
