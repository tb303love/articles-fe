import {SalesArticle} from '../../core/model';

export type ArticleState = {
  articles: SalesArticle[]; // Rezultat poslednje pretrage na serveru za `searchTerm`
  loadingStatus: {
    list: boolean;
    checkName: boolean;
    saving: boolean;
    writeOff: boolean;
  };
  isAvailable: boolean;
  searchTerm: string;
  totalCount: number | null; // Ukupno artikala na serveru, nezavisno od pretrage (null = još nije učitano)
  editingId: number | null,
};

export interface CheckNamePayload {
  name: string;
  excludeId?: number;
}

export const initialState: ArticleState = {
  articles: [],
  loadingStatus: {
    list: false,
    checkName: false,
    saving: false,
    writeOff: false,
  },
  isAvailable: false,
  searchTerm: '',
  totalCount: null,
  editingId: null,
};
