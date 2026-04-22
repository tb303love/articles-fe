export interface ArticleImage {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
}

export interface StockRequest {
  quantity: number;
  expirationDate: string; // ISO format (yyyy-MM-dd)
  batchNumber: string;
}

export interface ArticleCategory {
  id: number;
  categoryName: {
    name: string;
    id: number;
  };
}

export interface SalesArticle extends Omit<ArticleResponse, 'category'> {
  category: string | null;
  // totalStock i stocks su već tu jer su u ArticleResponse
}

export type SelectedSalesArticle = Omit<
  SalesArticle,
  'category' | 'image' | 'admissionPrice1' | 'admissionPrice2'
> & {
  // Ovde dodajemo quantity ako ti je potreban za trenutni odabir u korpi
  quantity: number;
};


export interface ArticleStock {
  id?: number;
  quantity: number;
  expirationDate: string | null;
  batchNumber: string | null;
  receivedAt?: string;
}

export interface ArticleResponse {
  id: number;
  name: string;
  price: number;
  admissionPrice1: number;
  admissionPrice2: number;
  active:boolean;
  totalStock: number; // Suma svih serija (umesto availableStock)
  stocks: ArticleStock[]; // NOVO: Ovde stižu rokovi sa backenda
  image: ArticleImage | null;
  category: ArticleCategory | null;
  composition: {
    articleId: number;
    name: string;
    quantity: number;
  }[] | null;
}

export interface ArticleImportRequest {
  name: string;
  price: number;
  admissionPrice1: number;
  admissionPrice2: number;
  wholesaleStock: number;
  retailStock: number;
  category?: string | null;
}

export interface StockRequest {
  quantity: number;
  expirationDate: string; // ISO format (yyyy-MM-dd)
  batchNumber: string;
}

export interface ArticleRequestComponent {
  componentId: number;
  quantity: number;
}

export interface ArticleRequest {
  name: string;
  price: number;
  admissionPrice1: number;
  admissionPrice2: number;
  categoryName: string;
  initialStocks: StockRequest[]; // Lista serija
  components: ArticleRequestComponent[];
}
