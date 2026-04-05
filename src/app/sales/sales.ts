import { CommonModule } from '@angular/common';
import {
    Component,
    DestroyRef,
    ElementRef,
    HostListener,
    OnInit,
    effect,
    inject,
    model,
    signal,
    untracked,
    viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// Material & Lokalni importi
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';

import { CartList } from '../cart-list/cart-list';
import { OrderType, SalesArticle, SelectedSalesArticle } from '../core/model';
import { AuthService } from '../core/services/auth-service';
import { SalesService } from '../core/services/sales-service';
import { StockSyncService } from '../core/services/stock-sync-service';
import { OrdersList } from '../orders-list/orders-list';
import { LongPressDirective } from '../shared/directives';
import { ImageDomSanitizerPipe } from '../shared/pipes/image-dom-sanitizer';
import { ArticleStore } from '../store/article.store';
import { OrderStore } from '../store/order/order.store';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ImageDomSanitizerPipe,
    MatCardModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatCheckboxModule,
    OrdersList,
    CartList,
    LongPressDirective,
  ],
  providers: [SalesService],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
})
export class Sales implements OnInit {
  // Inject-ovanje servisa i store-ova
  protected readonly salesService = inject(SalesService);
  protected readonly articlesStore = inject(ArticleStore);
  protected readonly orderStore = inject(OrderStore);
  private readonly stockSync = inject(StockSyncService);
  protected readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // View references (Signali)
  private cartList = viewChild(CartList);
  private searchInput = viewChild('searchInput', { read: ElementRef<HTMLInputElement> });

  // Stanje za fokus i UI
  private lastAddedId = signal<number | null>(null);
  readonly printReceipt = model(false);
  readonly isGratis = model(false);

  constructor() {
    this.initFocusEffect();
    this.initDrawerAutoCloseEffect();
  }

  ngOnInit(): void {
    this.clearSearch();
    this.loadInitialData();
    this.setupSubscriptions();
  }

  private initFocusEffect() {
    effect(() => {
      const idToFocus = this.lastAddedId();
      // Pristupamo spinerima koji su sada unutar CartList komponente
      const currentSpinners = this.cartList()?.spinners() || [];

      if (idToFocus && currentSpinners.length > 0) {
        const target = currentSpinners.find((s) => s.articleId() === idToFocus);
        if (target) {
          target.focusInput();
          untracked(() => this.lastAddedId.set(null));
        }
      }
    });
  }

  private initDrawerAutoCloseEffect() {
    effect(() => {
      if (this.salesService.selectedArticlesSize() === 0) {
        this.printReceipt.set(false);
        this.isGratis.set(false);
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    // SHIFT + DELETE -> Brisanje cele korpe (kroz dijalog u CartList)
    if (event.shiftKey && event.key === 'Delete') {
      event.preventDefault();
      this.cartList()?.triggerClearWithConfirmation();
    }

    // DELETE -> Brisanje fokusiranog artikla
    if (event.key === 'Delete' && !event.shiftKey) {
      this.handleSingleDelete(event);
    }

    // ESC -> Čišćenje pretrage
    if (event.key === 'Escape') {
      if (this.articlesStore.filterQuery()) {
        event.preventDefault();
        this.clearSearch();
      }
      (document.activeElement as HTMLElement)?.blur();
    }
  }

  private handleSingleDelete(event: KeyboardEvent) {
    const allSpinners = this.cartList()?.spinners() || [];
    const currentIndex = allSpinners.findIndex((s) => s.hasFocus());

    if (currentIndex !== -1) {
      event.preventDefault();

      let nextIdToFocus: number | null = null;
      if (allSpinners.length > 1) {
        const nextIndex =
          currentIndex === allSpinners.length - 1 ? currentIndex - 1 : currentIndex + 1;
        nextIdToFocus = allSpinners[nextIndex].articleId();
      }

      const articleId = allSpinners[currentIndex].articleId();
      const article = this.salesService.selectedArticles().get(articleId);

      if (article) {
        this.lastAddedId.set(nextIdToFocus);
        this.removeFromCart(article);
        if (!nextIdToFocus) this.searchInput()?.nativeElement.focus();
      }
    }
  }

  // Akcije
  addToCart(article: SalesArticle, isOutOfStock: boolean) {
    if (isOutOfStock) return;
    this.lastAddedId.set(article.id);
    this.salesService.addToCart(article);
  }

  removeFromCart(article: SelectedSalesArticle) {
    this.salesService.removeFromCart(article);
  }

  placeOrder() {
    const saleType = this.printReceipt() ? OrderType.RETAIL : OrderType.WHOLESALE;
    const isGratis = this.isGratis();
    
    const items = [...this.salesService.selectedArticles().values()].map((a) => ({
      articleId: a.id,
      quantity: a.quantity,
    }));

    this.orderStore.createOrder({ items, type: saleType, isGratis });
  }
  
  generateReport() {
    this.orderStore.generateReport();
  }
  
  generateMonthlyReport() {
    this.orderStore.generateMonthlyReport();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.articlesStore.updateFilter(value);
  }

  clearSearch() {
    this.articlesStore.updateFilter('');
  }

  private loadInitialData() {
    this.articlesStore.loadAll();
    this.orderStore.getTodayOrders();
    this.orderStore.getTodayRevenue();
  }

  private setupSubscriptions() {
    this.stockSync.stockUpdate$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.salesService.clearCart();
      this.printReceipt.set(false);
    });

    this.salesService.localSuccess$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.printReceipt.set(false));
  }
}
