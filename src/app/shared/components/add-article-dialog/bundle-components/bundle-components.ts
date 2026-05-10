import {Component, computed, inject, input, OnInit} from '@angular/core';
import {MatError, MatFormField, MatInput} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {FormArray, FormGroupDirective, ReactiveFormsModule, Validators} from '@angular/forms';
import {createComponentGroup} from '../add-article-form-logic';
import {ArticleStore} from '../../../../store';
import {SalesArticle} from '../../../../core/model';
import {MatIconButton} from '@angular/material/button';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bundle-components',
  imports: [
    MatFormField,
    MatIcon,
    MatAutocomplete,
    MatOption,
    ReactiveFormsModule,
    MatAutocompleteTrigger,
    MatInput,
    MatIconButton,
    MatError
  ],
  templateUrl: './bundle-components.html',
  styleUrl: './bundle-components.scss',
})
export class BundleComponents implements OnInit {
  private readonly rootFormGroup = inject(FormGroupDirective);
  private readonly articleStore = inject(ArticleStore);
  dialogData = input<SalesArticle | null>();
  private readonly componentsValue = toSignal(this.components.valueChanges, {initialValue: this.components.value});

  // Prosledi funkcije za filtriranje kao Inpute ako zavise od glavnog Store-a
  protected readonly filteredArticlesPerIndex = computed(() => {
    const currentArticles = this.articleStore.articles();
    const formValues = this.componentsValue();
    const editingId = this.dialogData()?.id;

    // Vraćamo mapu gde je ključ indeks reda, a vrednost filtrirani artikli
    return formValues.map((val: any) => {
      const search = (val.name || '').toLowerCase();

      return currentArticles.filter(art =>
        art.name.toLowerCase().includes(search) &&
        art.id !== editingId &&
        art.totalStock > 0 &&
        (!art.composition || art.composition.length === 0)
      );
    });
  });

  get parentForm() {
    return this.rootFormGroup.form;
  }

  get components() {
    return this.parentForm.get('components') as FormArray;
  }

  ngOnInit() {
    const group = this.components;
    group.get('componentId')?.valueChanges.subscribe((selectedId) => {
      // Ovde koristimo novi totalStock ili stocks sumu iz store-a ako postoji
      const selectedArt = this.articleStore.articles().find((a: any) => a.id === selectedId);
      const stock = selectedArt?.totalStock || 0;

      group
        .get('quantity')
        ?.setValidators([Validators.required, Validators.min(1), Validators.max(stock)]);
      group.get('quantity')?.updateValueAndValidity();
    });
  }

  addComponent() {
    this.components.push(createComponentGroup());
  }

  removeComponent(index: number) {
    this.components.removeAt(index);
  }

  protected onSelected(event: any, index: number) {
    const selectedName = event.option.value;
    const article = this.articleStore.articles().find((a) => a.name === selectedName);

    if (article) {
      const group = this.components.at(index);
      // Upisujemo ID koji je ključan za slanje na backend
      group.get('componentId')?.setValue(article.id);

      // Opciono: Ažuriramo validaciju da količina ne može biti veća od dostupne u magacinu
      group.get('quantity')?.setValidators([Validators.required, Validators.min(1), Validators.max(article.totalStock)]);
      // group.get('quantity')?.updateValueAndValidity();
    }
  }
}
