import { ArticleResponse, SalesArticle } from '../../core/model';



export function mapSaleArticlaToSelectedSaleArticle<
  T extends {
    name: string;
    id: number;
    price: number;
    availableStock: number;
    quantity: number;
  },
>(currentArticle: T, quantity: number) {
  return {
    name: currentArticle.name,
    id: currentArticle.id,
    price: currentArticle.price,
    availableStock: currentArticle.availableStock,
    quantity,
  };
}
