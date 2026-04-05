import { FormArray, FormControl, FormGroup } from '@angular/forms';

// Tip za jednu stavku zaliha (Stock Batch)
export type StockFormGroup = FormGroup<{
  quantity: FormControl<number>;
  expirationDate: FormControl<string | null>;
  batchNumber: FormControl<string | null>;
}>;

// Tip za jednu komponentu Bundle-a
export type ComponentFormGroup = FormGroup<{
  componentId: FormControl<number | null>;
  quantity: FormControl<number | null>;
  name: FormControl<string | null>;
}>;

// Glavna struktura kontrola u formi
export interface AddArticleFormControls {
  name: FormControl<string>;
  price: FormControl<number>;
  admissionPrice1: FormControl<number>;
  admissionPrice2: FormControl<number>;
  initialStocks: FormArray<StockFormGroup>;
  image: FormControl<File | null>;
  category: FormControl<string | null>;
  components: FormArray<ComponentFormGroup>;
}

// Finalni tip forme koji koristiš u komponenti
export type ArticleFormGroup = FormGroup<AddArticleFormControls>;
