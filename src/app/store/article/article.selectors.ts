import {signalStoreFeature, type, withComputed} from '@ngrx/signals';
import {ArticleState} from './article.state';
import {computed} from '@angular/core';

export function withArticleSelectors() {
  return signalStoreFeature(
    { state: type<ArticleState>() },
    withComputed(({articles, filterQuery}) => ({
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
  )
}
