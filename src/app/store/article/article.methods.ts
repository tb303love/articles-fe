import {patchState, signalStoreFeature, type, withMethods} from '@ngrx/signals';
import {ArticleState, CheckNamePayload} from './article.state';
import {computed, inject} from '@angular/core';
import {ArticlesApiService} from '../../core/services/articles-api-service';
import {catchError, debounceTime, EMPTY, filter, map, pipe, Subject, switchMap, tap} from 'rxjs';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {ArticleResponse, SalesArticle} from '../../core/model';
import {HttpEventType, HttpResponse} from '@angular/common/http';

export function withArticleMethods() {
  const operationSuccessSubject = new Subject<void>();
  return signalStoreFeature(
    { state: type<ArticleState>() },
    withMethods((store, articleService = inject(ArticlesApiService)) => {
      return {
        operationSuccess$() {
          return operationSuccessSubject.asObservable();
        },
        getArticleByBarcode(barcode: string) {
          return computed(() => store.articles().find((item) => item.barcodes.includes(barcode)));
        },
        getAffectedBundles: rxMethod<number>(pipe(
          switchMap((id) => articleService.getAffectedBundles(id)),
        )),
        checkArticleName: rxMethod<CheckNamePayload>(
          pipe(
            tap(() =>
              patchState(store, {loadingStatus: {...store.loadingStatus(), checkName: true}}),
            ),
            debounceTime(500),
            switchMap(({name, excludeId}) => {
              const request$ = excludeId
                ? articleService.checkArticleNameButExcludeCurrent(name, excludeId)
                : articleService.checkArticleName(name);

              return request$.pipe(
                tap((taken) => {
                  patchState(store, {
                    isAvailable: taken,
                    loadingStatus: {...store.loadingStatus(), checkName: false},
                  });
                }),
                catchError(() => {
                  patchState(store, {
                    loadingStatus: {...store.loadingStatus(), checkName: false},
                  });
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        updateFilter(query: string) {
          patchState(store, {filterQuery: query});
        },
        loadAll: rxMethod<string>(
          pipe(
            tap(() => patchState(store, {loadingStatus: {...store.loadingStatus(), list: true}})),
            switchMap((searchTerm) =>
              articleService.getArticles().pipe(
                map((articles) => articles.map(mapToSalesArticle)), // Mapiramo svaki artikal na SalesArticle
                tap((articles) =>
                  patchState(store, {
                    articles,
                    loadingStatus: {...store.loadingStatus(), list: false},
                    searchTerm
                  }),
                ),
              ),
            ),
          ),
        ),
        createArticle(formData: FormData) {
          patchState(store, {loadingStatus: {...store.loadingStatus(), saving: true}});
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
              next: () => {
                patchState(store, {loadingStatus: {...store.loadingStatus(), saving: false}});
                this.loadAll(store.searchTerm);
                operationSuccessSubject.next();
              },
              error: (err) => {
                patchState(store, {loadingStatus: {...store.loadingStatus(), saving: false}});
                console.error('Create error:', err);
              },
            });
        },
        updateArticle(id: number, formData: FormData) {
          patchState(store, {loadingStatus: {...store.loadingStatus(), saving: true}});
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
              next: () => {
                patchState(store, () => ({
                  loadingStatus: {...store.loadingStatus(), saving: false},
                }));
                this.loadAll(store.searchTerm);
                operationSuccessSubject.next();
              },
              error: (err) => {
                patchState(store, {loadingStatus: {...store.loadingStatus(), saving: false}});
                console.error('Update error:', err);
              },
            });
        },
        deleteArticle(id: number) {
          patchState(store, {loadingStatus: {...store.loadingStatus(), saving: true}});
          articleService.deleteArticle(id).subscribe({
            next: () => {
              patchState(store, (state) => ({
                articles: state.articles.filter((a) => a.id !== id),
                loadingStatus: {...store.loadingStatus(), saving: false},
              }));
              operationSuccessSubject.next();
            },
            error: (err: any) => {
              patchState(store, {loadingStatus: {...store.loadingStatus(), saving: false}});
              console.error('Delete error:', err);
            },
          });
        },
        writeOffArticleStock(id: number) {
          patchState(store, {loadingStatus: {...store.loadingStatus(), writeOff: true}});
          articleService.writeOffArticleStock(id).subscribe({
            next: () => {
              patchState(store, (state) => ({
                articles: state.articles.filter((a) => a.id !== id),
                loadingStatus: {...store.loadingStatus(), writeOff: false},
              }));
              operationSuccessSubject.next();
            },
            error: (err: any) => {
              patchState(store, {loadingStatus: {...store.loadingStatus(), writeOff: false}});
              console.error('Write off error:', err);
            },
          });
        },
      };
    }),
  )
}

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
