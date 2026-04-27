import {Component, inject, input} from '@angular/core';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {FormArray, FormGroupDirective, ReactiveFormsModule, Validators} from '@angular/forms';
import {createComponentGroup} from '../add-article-form-logic';
import {ArticleStore} from '../../../../store';
import {SalesArticle} from '../../../../core/model';
import {MatButton, MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-bundle-components',
  imports: [
    MatFormField,
    MatIcon,
    MatAutocomplete,
    MatOption,
    ReactiveFormsModule,
    MatAutocompleteTrigger,
    MatButton,
    MatInput,
    MatIconButton
  ],
  templateUrl: './bundle-components.html',
  styleUrl: './bundle-components.scss',
})
export class BundleComponents {
  private readonly rootFormGroup = inject(FormGroupDirective);
  private readonly articleStore = inject(ArticleStore);
  dialogData = input<SalesArticle | null>();

  // Prosledi funkcije za filtriranje kao Inpute ako zavise od glavnog Store-a
  protected getFilteredArticles(index: number) {
    // Uzimamo trenutnu vrednost iz polja 'name' za tu komponentu
    const control = this.components.at(index).get('name');
    const searchValue = (control?.value || '').toString().toLowerCase();

    return this.articleStore.articles().filter(
      (art) =>
        // 1. Naziv se poklapa
        art.name.toLowerCase().includes(searchValue) &&
        // 2. Ne dozvoljavamo da artikal sadrži samog sebe (ako je u Edit modu)
        art.id !== this.dialogData()?.id &&
        art.totalStock > 0
        &&
        // 3. Ne nudimo druge artikle koji su već Bundle (da izbegnemo preveliku dubinu)
        (art.composition === null || art.composition.length === 0),
    );
  }

  get parentForm() {
    return this.rootFormGroup.form;
  }

  get components() {
    return this.parentForm.get('components') as FormArray;
  }

  addComponent() {
    this.components.push(createComponentGroup(this.articleStore));
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
      group.get('quantity')?.setValidators([Validators.required, Validators.min(1)]);
      group.get('quantity')?.updateValueAndValidity();
    }
  }
}
