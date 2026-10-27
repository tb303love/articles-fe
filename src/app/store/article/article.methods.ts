import {patchState, signalStoreFeature, type, withMethods} from '@ngrx/signals';
import {ArticleState, CheckNamePayload} from './article.state';
import {inject, Injector} from '@angular/core';
import {ArticlesApiService} from '../../core/services/articles-api-service';
import {catchError, debounceTime, EMPTY, filter, map, Observable, pipe, Subject, switchMap, tap} from 'rxjs';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {ArticleResponse, SalesArticle} from '../../core/model';
import {HttpEventType, HttpResponse} from '@angular/common/http';

export function withArticleMethods() {
   const operationSuccessSubject = new Subject<void>();
   return signalStoreFeature(
      {state: type<ArticleState>()},
      withMethods((store, injector = inject(Injector)) => {
         const articleService = injector.get(ArticlesApiService);

         // switchMap: novi zahtev otkazuje prethodni, pa stariji odgovor nikad ne pregazi noviji
         const loadArticles = rxMethod<string>(
            pipe(
               tap(() => patchState(store, {loadingStatus: {...store.loadingStatus(), list: true}})),
               switchMap((query) =>
                  articleService.getArticles(query).pipe(
                     map((articles) => articles.map(mapToSalesArticle)),
                     tap((articles) =>
                        patchState(store, {
                           // Odgovor za upit koji više nije aktuelan se odbacuje
                           ...(query === store.searchTerm() ? {articles} : {}),
                           loadingStatus: {...store.loadingStatus(), list: false},
                        }),
                     ),
                     catchError(() => {
                        patchState(store, {loadingStatus: {...store.loadingStatus(), list: false}});
                        return EMPTY;
                     }),
                  ),
               ),
            ), {injector},
         );

         const loadCount = rxMethod<void>(
            pipe(
               switchMap(() =>
                  articleService.countArticles().pipe(
                     tap((totalCount) => patchState(store, {totalCount})),
                     catchError(() => EMPTY),
                  ),
               ),
            ), {injector},
         );

         // Server se pita tek kad korisnik zastane sa kucanjem, i to uvek za trenutni upit iz store-a
         const debouncedSearch = rxMethod<void>(
            pipe(
               debounceTime(300),
               tap(() => loadArticles(store.searchTerm())),
            ), {injector},
         );

         return {
            operationSuccess$() {
               return operationSuccessSubject.asObservable();
            },
            setCurrentEditingArticle(editingId: number | null) {
               patchState(store, {editingId});
            },
            /** Sveže stanje artikla direktno sa servera (npr. pri skeniranju u prodaji) */
            findByBarcode(barcode: string): Observable<SalesArticle> {
               return articleService.findByBarcode(barcode).pipe(map(mapToSalesArticle));
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
            /** Kucanje u polju za pretragu - upit se odmah prikazuje, lista stiže sa servera */
            search(query: string) {
               patchState(store, {searchTerm: query});
               debouncedSearch();
            },
            /** Prazna pretraga i odmah sveža puna lista + ukupan broj */
            resetSearch() {
               patchState(store, {searchTerm: ''});
               loadArticles('');
               loadCount();
            },
            /** Ponovo učitava trenutnu pretragu i ukupan broj (posle izmena, prodaje, uvoza) */
            reload() {
               loadArticles(store.searchTerm());
               loadCount();
            },
            loadCount,
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
                        this.reload();
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
                        this.reload();
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
                     patchState(store, {loadingStatus: {...store.loadingStatus(), saving: false}});
                     // IZMENJENO: Povuci sveže stanje sa bekenda kako bi se tabela garantovano osvežila
                     this.reload();
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
                     patchState(store, {loadingStatus: {...store.loadingStatus(), writeOff: false}});
                     // IZMENJENO: I ovde osveži kompletno stanje nakon otpisa
                     this.reload();
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
