import { Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { filter, map, of, take } from 'rxjs';
import { SalesArticle } from '../core/model';
import { ArticleStore } from '../store/article.store';

const floatRegex = /^\d*(\.\d+)?$/;

export function floatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null; // Don't validate empty values
    }

    const isPositiveFloat = floatRegex.test(value) && parseFloat(value) >= 0;
    return isPositiveFloat ? null : { invalidFloat: { value: value } };
  };
}

export function validateImage(control: AbstractControl<File>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return control.value.size > 16777216 ? { maxFileSize: true } : null;
}

export function checkArticleName(
  store: InstanceType<typeof ArticleStore>,
  injector: Injector,
  excludedId?: number,
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (control.pristine) {
      return of(null);
    }
    if (!control.value) return of(null);

    // 1. Aktiviraš proveru u store-u
    store.checkArticleName({ name: control.value, excludeId: excludedId });

    // 2. Čekaš da 'isChecking' postane false i vratiš rezultat na osnovu 'isAvailable'
    return toObservable(store.loadingStatus.checkName, { injector }).pipe(
      filter((loading) => !loading), // Čekaj da završi
      take(1),
      map(() => (store.isAvailable() ? null : { nameTaken: true })),
    );
  };
}

export function articleNoChangesValidator(
  initialArticle: SalesArticle,
  initialFile: File | null,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const formValue = group.value;

    // 1. Provera osnovnih polja
    const fieldsChanged =
      formValue.name !== initialArticle.name ||
      formValue.price !== initialArticle.price ||
      formValue.admissionPrice1 !== initialArticle.admissionPrice1 ||
      formValue.admissionPrice2 !== initialArticle.admissionPrice2 ||
      formValue.category !== initialArticle.category;

    // 2. Provera slike
    const imageChanged = formValue.image !== initialFile;

    // 3. Provera zaliha (poređenje nizova objekata)
    // Pretpostavljamo da SalesArticle ima 'stocks', a forma 'initialStocks'
    const initialStocks = initialArticle.stocks || [];
    const currentStocks = formValue.initialStocks || [];

    const stocksChanged = JSON.stringify(initialStocks.map(s => ({
      quantity: s.quantity,
      expirationDate: s.expirationDate,
      batchNumber: s.batchNumber
    }))) !== JSON.stringify(currentStocks);

    // Ako je bilo šta promenjeno, vraćamo null (validno), inače grešku noChanges
    return fieldsChanged || imageChanged || stocksChanged ? null : { noChanges: true };
  };
}
