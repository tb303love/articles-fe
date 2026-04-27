import {SalesArticle} from '../../core/model';

export type ArticleState = {
  articles: SalesArticle[];
  loadingStatus: {
    list: boolean;
    checkName: boolean;
    saving: boolean;
    writeOff: boolean;
  };
  filterQuery: string;
  isAvailable: boolean;
  searchTerm: string;
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
  filterQuery: '',
  isAvailable: false,
  searchTerm: ''
};
