import {HttpClient} from '@angular/common/http';
import {computed, inject, Injectable, signal} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Order, OrderRequest, OrderType, RevenueSummary, SalesArticle, SelectedSalesArticle,} from '../model';
import {BarcodeService} from './barcode.service';
import {ArticleStore} from '../../store/article/article.store';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private readonly http = inject(HttpClient);
  private readonly barcodeService = inject(BarcodeService);
  private readonly articleStore = inject(ArticleStore)

  private readonly localSuccessSubject = new Subject<void>();
  readonly localSuccess$ = this.localSuccessSubject.asObservable();

  // Glavno stanje korpe kao Map za O(1) pristup po ID-u
  readonly selectedArticles = signal<Map<number, SelectedSalesArticle>>(new Map());

  // Izvedene vrednosti (Computed signali su ekstremno brzi za 1366px rezoluciju)
  readonly selectedArticlesSize = computed(() => this.selectedArticles().size);

  readonly totalPrice = computed(() => {
    let total = 0;
    for (const item of this.selectedArticles().values()) {
      total += item.price * item.quantity;
    }
    return total;
  });

  constructor() {
    this.barcodeService.salesScans$.subscribe(barcode => {
      const article = this.articleStore.getArticleByBarcode(barcode);
      const art = article();
      if (art) {
        this.addToCart(art);
      }
    });
  }

  // --- API METODE ---
  placeOrder(orderRequest: OrderRequest) {
    return this.http.post<Order>(this.apiUrl, {
      items: orderRequest.items,
      type: orderRequest.type.toLocaleUpperCase(),
      isGratis: orderRequest.isGratis,
    });
  }

  fetchTodayOrders() {
    return this.http.get<Order[]>(`${this.apiUrl}/today`);
  }

  getTodayRevenue() {
    return this.http.get<RevenueSummary>(`${this.apiUrl}/revenue/today`);
  }

  updateOrderType(orderId: number, newType: OrderType) {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/type?newType=${newType}`, {});
  }

  // --- LOGIKA KORPE (CART) ---

  clearCart() {
    this.selectedArticles.set(new Map());
    this.localSuccessSubject.next();
  }

  /**
   * Centralizovana metoda za promenu količine.
   * Koristi se i za direktan unos, i za gumbe +/-, i za dodavanje u korpu.
   */
  updateQuantity(articleId: number, targetQuantity: number): void {
    this.selectedArticles.update((articles) => {
      const current = articles.get(articleId);
      if (!current) return articles;

      // IZMENA: Koristimo totalStock umesto availableStock
      const newQuantity = Math.max(1, Math.min(targetQuantity, current.totalStock));

      if (current.quantity === newQuantity) return articles;

      const updatedMap = new Map(articles);
      updatedMap.set(articleId, {
        ...current,
        quantity: newQuantity,
      });

      return updatedMap;
    });
  }

  addToCart(article: SalesArticle): void {
    this.selectedArticles.update((articles) => {
      const existing = articles.get(article.id);

      if (existing) {
        const newQuantity = existing.quantity + 1;
        // IZMENA: Provera protiv totalStock
        if (newQuantity > existing.totalStock) return articles;

        const updatedMap = new Map(articles);
        updatedMap.set(article.id, {...existing, quantity: newQuantity});
        return updatedMap;
      }

      // IZMENA: Provera da li uopšte ima zaliha (totalStock)
      if (article.totalStock === 0) return articles;

      const updatedMap = new Map(articles);

      // IZMENA: Destrukturiranje koristi totalStock
      const {id, name, price, totalStock} = article;
      updatedMap.set(id, {
        id,
        name,
        price,
        totalStock, // Mapiramo ispravno polje
        quantity: 1,
      } as SelectedSalesArticle);

      return updatedMap;
    });
  }

  removeFromCart(article: SelectedSalesArticle): void {
    this.selectedArticles.update((articles) => {
      // 1. Brza provera - ako artikla nema, vraćamo istu referencu.
      // Angular Signal vidi da je referenca ista i NE pokreće Change Detection (0 ms trošak).
      if (!articles.has(article.id)) return articles;

      // 2. Kreiramo novu mapu samo kada je brisanje potvrđeno.
      const updatedMap = new Map(articles);
      updatedMap.delete(article.id);

      return updatedMap;
    });
  }

  // U tvom OrderService-u
  sendTestReport(): Observable<string> {
    return this.http.get(`${environment.apiUrl}/test-reports/send-daily`, {
      params: {email: 'darko.damljanovic@gmail.com'},
      responseType: 'text', // Jer endpoint vraća običan String
    });
  }

  sendTestMonthlyReport(): Observable<string> {
    return this.http.get(`${environment.apiUrl}/test-reports/send-monthly`, {
      params: {email: 'darko.damljanovic@gmail.com'},
      responseType: 'text', // Jer endpoint vraća običan String
    });
  }
}
