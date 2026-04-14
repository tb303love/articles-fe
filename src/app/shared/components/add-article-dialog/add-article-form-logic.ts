import { Injector } from '@angular/core';
import { AsyncValidatorFn, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { SalesArticle } from '../../../core/model';
import {
  AddArticleFormControls,
  ArticleFormGroup,
  ComponentFormGroup,
  StockFormGroup,
} from '../../../core/model/article-form.model';
import { ArticleStore } from '../../../store/article.store';
import { articleNoChangesValidator, checkArticleName, validateImage } from '../../form-validators';

/**
 * Kreira grupu za jednu seriju zaliha (Stock Batch)
 */
export function createStockGroup(
  qty: number = 0,
  expiration: Date | null = null,
  batch: string = '',
): StockFormGroup {
  return new FormGroup({
    quantity: new FormControl(qty, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    expirationDate: new FormControl(expiration, {
      validators: [Validators.required],
    }),
    batchNumber: new FormControl(batch),
  });
}

/**
 * Kreira grupu za jednu komponentu paketa (Bundle)
 */
export function createComponentGroup(
  articleStore: any,
  id: number | null = null,
  qty: number = 1,
  name: string = '',
) {
  const group = new FormGroup({
    componentId: new FormControl(id, { validators: [Validators.required] }),
    quantity: new FormControl(qty, { validators: [Validators.required, Validators.min(1)] }),
    name: new FormControl(name),
  });

  group.get('componentId')?.valueChanges.subscribe((selectedId) => {
    // Ovde koristimo novi totalStock ili stocks sumu iz store-a ako postoji
    const selectedArt = articleStore.articles().find((a: any) => a.id === selectedId);
    const stock = selectedArt?.totalStock || 0;

    group
      .get('quantity')
      ?.setValidators([Validators.required, Validators.min(1), Validators.max(stock)]);
    group.get('quantity')?.updateValueAndValidity();
  });

  if (id) {
    group.get('componentId')?.updateValueAndValidity({ emitEvent: true });
  }

  return group;
}

/**
 * Inicijalizuje celu formu pri otvaranju (Create ili Edit)
 */
 export default function initializeForm(
   article: SalesArticle | null,
   articleStore: InstanceType<typeof ArticleStore>,
   injector: Injector,
   image: File | null,
 ): ArticleFormGroup {
   const nameAsyncValidators = article
     ? [checkArticleName(articleStore, injector, article.id)]
     : [checkArticleName(articleStore, injector)];
 
   const formGroup = createFormGroup(nameAsyncValidators);
 
   // Ako kreiramo NOVI artikal
   if (!article) {
     return formGroup;
   }
 
   // Ako EDITUJEMO postojeći artikal:
   
   // 1. Inicijalno prazan niz za NOVI ulaz robe (initialStocks)
   // Ne popunjavamo ga starim zalihama jer su one Read-Only
   formGroup.controls.initialStocks.clear({ emitEvent: false });
 
   // 2. Popunjavanje Bundle komponenti (ako je paket)
   if (article.composition && article.composition.length > 0) {
     article.composition.forEach((comp) => {
       formGroup.controls.components.push(
         createComponentGroup(articleStore, comp.articleId, comp.quantity, comp.name),
         { emitEvent: false }
       );
     });
     // Bundle nikada nema svoje zalihe
     formGroup.controls.initialStocks.clear({ emitEvent: false });
     formGroup.controls.initialStocks.disable({ emitEvent: false });
   }
 
   // 3. Postavljanje osnovnih vrednosti (name, price, category...)
   formGroup.patchValue({
     name: article.name,
     price: article.price,
     admissionPrice1: article.admissionPrice1,
     admissionPrice2: article.admissionPrice2,
     category: article.category,
     image,
   },{ emitEvent: false });
 
   // Validator za detekciju promena (da li je bilo šta pipnuto)
   formGroup.addValidators(articleNoChangesValidator(article, image));
 
   return formGroup;
 }

/**
 * Definiše osnovnu strukturu forme
 */
function createFormGroup(nameAsyncValidators: AsyncValidatorFn[]): ArticleFormGroup {
  return new FormGroup<AddArticleFormControls>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
      asyncValidators: nameAsyncValidators,
    }),
    price: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    admissionPrice1: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    admissionPrice2: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    // NOVO: FormArray za praćenje više serija i rokova
    initialStocks: new FormArray<StockFormGroup>([]),
    category: new FormControl(null),
    image: new FormControl<File | null>(null, {
      validators: [validateImage],
      nonNullable: false,
    }),
    components: new FormArray<ComponentFormGroup>([]),
  });
}
