import {Component, inject, input, ChangeDetectionStrategy, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatError, MatFormField, MatInput} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption
} from '@angular/material/autocomplete';
import {FieldTree, FormField} from '@angular/forms/signals';
import {catchError, debounceTime, map, of, Subject, switchMap} from 'rxjs';
import {createComponent} from '../add-article-form-logic';
import {ArticleResponse, SalesArticle} from '../../../../core/model';
import {ComponentFormModel} from '../../../../core/model/article-form.model';
import {ArticlesApiService} from '../../../../core/services/articles-api-service';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-bundle-components',
  imports: [
    MatFormField,
    MatIcon,
    MatAutocomplete,
    MatOption,
    FormField,
    MatAutocompleteTrigger,
    MatInput,
    MatIconButton,
    MatError
  ],
  templateUrl: './bundle-components.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './bundle-components.scss',
})
export class BundleComponents {
  private readonly articleApi = inject(ArticlesApiService);
  readonly components = input.required<FieldTree<ComponentFormModel[]>>();
  dialogData = input<SalesArticle | null>();

  // Predlozi po indeksu reda - uvek rezultat poslednje pretrage na serveru, ne kopija iz store-a
  protected readonly suggestions = signal<Record<number, ArticleResponse[]>>({});
  private readonly search$ = new Subject<{index: number; query: string}>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        // switchMap otkazuje prethodni zahtev - stariji odgovor nikad ne pregazi noviji
        switchMap(({index, query}) =>
          this.articleApi.getArticles(query).pipe(
            map((articles) => ({index, articles: articles.filter((art) => this.isValidComponent(art))})),
            catchError(() => of({index, articles: [] as ArticleResponse[]})),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({index, articles}) => this.suggestions.update((s) => ({...s, [index]: articles})));
  }

  protected searchComponents(index: number, query: string) {
    this.search$.next({index, query});
  }

  addComponent() {
    this.components()().value.update((components) => [...components, createComponent()]);
  }

  removeComponent(index: number) {
    this.components()().value.update((components) => components.filter((_, i) => i !== index));
    // Indeksi redova su se pomerili - predlozi se ponovo traže pri sledećem fokusu/kucanju
    this.suggestions.set({});
  }

  protected onSelected(event: MatAutocompleteSelectedEvent, index: number) {
    const selectedName = event.option.value;
    const article = (this.suggestions()[index] ?? []).find((a) => a.name === selectedName);

    if (article) {
      // ID je ključan za slanje na backend, a zaliha (sveža sa servera) služi za max validaciju količine
      this.components()[index].componentId().value.set(article.id);
      this.components()[index].availableStock().value.set(article.totalStock);
    }
  }

  // Komponenta paketa: običan artikal (ne paket), sa zalihom, i nije artikal koji se trenutno menja
  private isValidComponent(art: ArticleResponse): boolean {
    return art.id !== this.dialogData()?.id && art.totalStock > 0 && !art.composition?.length;
  }
}
