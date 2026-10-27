import {signalStoreFeature, type, withComputed} from '@ngrx/signals';
import {ArticleState} from './article.state';
import {computed} from '@angular/core';

export function withArticleSelectors() {
  return signalStoreFeature(
    {state: type<ArticleState>()},
    withComputed(({totalCount}) => ({
      // Postoji li ijedan artikal na serveru (navigacija, guard, prazno stanje liste)
      hasArticles: computed(() => (totalCount() ?? 0) > 0),
    })),
  )
}
