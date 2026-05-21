import {ArticleResponse} from './articles.model';

export interface BarCodeScan {
  barcode: string;
  expiryDate: string;
  quantity: number; // ISO format ili null
}

export interface NewInventoryScan {
  details: BarCodeScan;
}
export interface InventoryUpdate {
  article: ArticleResponse;
  stock: BarCodeScan;
}
