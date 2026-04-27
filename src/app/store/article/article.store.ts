import {inject} from '@angular/core';
import {signalStore, withHooks, withState,} from '@ngrx/signals';
import {StockSyncService} from '../../core/services/stock-sync-service';
import {initialState} from './article.state';
import {withArticleMethods} from './article.methods';
import {withArticleSelectors} from './article.selectors';


export const ArticleStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withArticleSelectors(),
  withArticleMethods(),
  withHooks({
    onInit(store, stockSync = inject(StockSyncService)) {
      stockSync.stockUpdate$.subscribe(() => {
        store.loadAll(store.searchTerm()); // Važno: searchTerm mora biti pozvan kao funkcija ()
      });
    },
  }),
);
