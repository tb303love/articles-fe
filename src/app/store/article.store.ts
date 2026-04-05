import { HttpEventType, HttpResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, debounceTime, EMPTY, filter, map, pipe, Subject, switchMap, tap } from 'rxjs';
import { ArticleResponse, OrderType, SalesArticle } from '../core/model';
import { ArticlesApiService } from '../core/services/articles-api-service';
import { StockSyncService, StockUpdate } from '../core/services/stock-sync-service';

// Definiši interfejs stanja
type ArticleState = {
  articles: SalesArticle[];
  loadingStatus: {
    list: boolean;
    checkName: boolean;
    saving: boolean;
  };
  filterQuery: string;
  isAvailable: boolean;
};

export interface CheckNamePayload {
  name: string;
  excludeId?: number;
}

const initialState: ArticleState = {
  articles: [],
  loadingStatus: {
    list: false,
    checkName: false,
    saving: false,
  },
  filterQuery: '',
  isAvailable: false,
};

export const ArticleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ articles, filterQuery }) => ({
    baseArticles: computed(() =>
      articles().filter((a) => !a.composition || a.composition.length === 0),
    ),
    filteredArticles: computed(() => {
      const query = filterQuery().toLowerCase();
      const allArticles = articles();
      if (!query) return allArticles;
      return allArticles.filter((a) => a.name.toLowerCase().includes(query));
    }),
    count: computed(() => articles().length),
  })),
  withMethods((store, articleService = inject(ArticlesApiService)) => {
    const operationSuccessSubject = new Subject<void>();

    return {
      operationSuccess$() {
        return operationSuccessSubject.asObservable();
      },
      checkArticleName: rxMethod<CheckNamePayload>(
        pipe(
          tap(() =>
            patchState(store, { loadingStatus: { ...store.loadingStatus(), checkName: true } }),
          ),
          debounceTime(500),
          switchMap(({ name, excludeId }) => {
            const request$ = excludeId
              ? articleService.checkArticleNameButExcludeCurrent(name, excludeId)
              : articleService.checkArticleName(name);

            return request$.pipe(
              tap((taken) => {
                patchState(store, {
                  isAvailable: taken,
                  loadingStatus: { ...store.loadingStatus(), checkName: false },
                });
              }),
              catchError(() => {
                patchState(store, {
                  loadingStatus: { ...store.loadingStatus(), checkName: false },
                });
                return EMPTY;
              }),
            );
          }),
        ),
      ),
      updateFilter(query: string) {
        patchState(store, { filterQuery: query });
      },
      loadAll: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loadingStatus: { ...store.loadingStatus(), list: true } })),
          switchMap(() =>
            articleService.getArticles().pipe(
              map((articles) => articles.map(mapToSalesArticle)), // Mapiramo svaki artikal na SalesArticle
              tap((articles) =>
                patchState(store, {
                  articles,
                  loadingStatus: { ...store.loadingStatus(), list: false },
                }),
              ),
            ),
          ),
        ),
      ),
      // --- SINHRONIZACIJA ZALIHA ---
      updateStock(update: StockUpdate) {
        patchState(store, (state) => ({
          articles: state.articles.map((article) => {
            // 1. Pronađi SVE stavke koje se odnose na ovaj artikal (može ih biti više zbog serija)
            const relevantItems = update.items.filter((item) => item.articleId === article.id);
      
            if (relevantItems.length > 0) {
              // 2. Saberi ukupnu količinu iz svih stavki (npr. 10 + 5 = 15)
              const totalQuantityInUpdate = relevantItems.reduce((sum, item) => sum + item.quantity, 0);
      
              // 3. Odredi smer (Refund dodaje, Sale oduzima)
              const multiplier = update.type === OrderType.REFUND ? 1 : -1;
              const finalChange = totalQuantityInUpdate * multiplier;
      
              return {
                ...article,
                // 4. Ažuriraj totalStock sa ukupnom sumom promene
                totalStock: (article.totalStock || 0) + finalChange,
              };
            }
            return article;
          }),
        }));
      },
      createArticle(formData: FormData) {
        patchState(store, { loadingStatus: { ...store.loadingStatus(), saving: true } });
        articleService
          .addNewArticle(formData)
          .pipe(
            filter(
              (event): event is HttpResponse<ArticleResponse> =>
                event.type === HttpEventType.Response,
            ),
            map((event) => event.body as ArticleResponse),
          )
          .subscribe({
            next: (response) => {
              const newArt = mapToSalesArticle(response);
              patchState(store, (state) => ({
                articles: [newArt, ...state.articles],
                loadingStatus: { ...store.loadingStatus(), saving: false },
              }));
              operationSuccessSubject.next();
            },
            error: (err) => {
              patchState(store, { loadingStatus: { ...store.loadingStatus(), saving: false } });
              console.error('Create error:', err);
            },
          });
      },
      updateArticle(id: number, formData: FormData) {
        patchState(store, { loadingStatus: { ...store.loadingStatus(), saving: true } });
        articleService
          .updateArticle(id, formData)
          .pipe(
            filter(
              (event): event is HttpResponse<ArticleResponse> =>
                event.type === HttpEventType.Response,
            ),
            map((event) => event.body as ArticleResponse),
          )
          .subscribe({
            next: (response) => {
              const updatedArt = mapToSalesArticle(response);
              patchState(store, (state) => ({
                articles: state.articles.map((a) => (a.id === id ? updatedArt : a)),
                loadingStatus: { ...store.loadingStatus(), saving: false },
              }));
              operationSuccessSubject.next();
            },
            error: (err) => {
              patchState(store, { loadingStatus: { ...store.loadingStatus(), saving: false } });
              console.error('Update error:', err);
            },
          });
      },
      deleteArticle(id: number) {
        patchState(store, { loadingStatus: { ...store.loadingStatus(), saving: true } });
        articleService.deleteArticle(id).subscribe({
          next: () => {
            patchState(store, (state) => ({
              articles: state.articles.filter((a) => a.id !== id),
              loadingStatus: { ...store.loadingStatus(), saving: false },
            }));
            operationSuccessSubject.next();
          },
          error: (err: any) => {
            patchState(store, { loadingStatus: { ...store.loadingStatus(), saving: false } });
            console.error('Delete error:', err);
          },
        });
      },
    };
  }),
  withHooks({
    onInit(store, stockSync = inject(StockSyncService)) {
      stockSync.stockUpdate$.subscribe((updates) => store.updateStock(updates));
    },
  }),
);

/**
 * Pomoćna funkcija za mapiranje ArticleResponse (sa bekenda) u SalesArticle (za UI)
 */
function mapToSalesArticle(res: ArticleResponse): SalesArticle {
  return {
    ...res,
    category: res.category ? res.category.categoryName.name : null,
    // totalStock je zbir svih serija sa backenda
    totalStock: res.totalStock || 0, // Privremeno mapiramo na availableStock ako se polje na bekendu još zove tako
    stocks: res.stocks || [], // Važno za Edit mod i popunjavanje Forme
  } as SalesArticle;
}
