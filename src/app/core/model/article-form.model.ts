// Model jedne serije zaliha (Stock Batch)
export interface StockFormModel {
  quantity: number;
  expirationDate: Date | string | null;
  batchNumber: string;
}

// Model jedne komponente Bundle-a
export interface ComponentFormModel {
  componentId: number | null;
  quantity: number;
  name: string;
  availableStock: number | null; // Sveža zaliha sa servera (pri izboru ili otvaranju forme), za max validaciju
}

// Model cele forme artikla (signal forms)
export interface ArticleFormModel {
  name: string;
  barcodes: string[];
  price: number;
  active: boolean;
  admissionPrice1: number;
  admissionPrice2: number;
  category: string;
  isBundle: boolean;
  initialStocks: StockFormModel[];
  components: ComponentFormModel[];
  image: File | null;
}
