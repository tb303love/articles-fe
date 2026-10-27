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
      // Posle prodaje zalihe su se promenile - povlačimo sveže stanje za trenutnu pretragu
      stockSync.stockUpdate$.subscribe(() => store.reload());
    },
  }),
);
