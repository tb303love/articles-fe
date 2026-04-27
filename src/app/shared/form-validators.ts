import {Injector} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {AbstractControl, AsyncValidatorFn, FormArray, ValidationErrors, ValidatorFn} from '@angular/forms';
import {filter, map, of, take} from 'rxjs';
import {SalesArticle} from '../core/model';
import {ArticleStore} from '../store';

export function validateImage(control: AbstractControl<File>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return control.value.size > 16777216 ? {maxFileSize: true} : null;
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
    store.checkArticleName({name: control.value, excludeId: excludedId});

    // 2. Čekaš da 'isChecking' postane false i vratiš rezultat na osnovu 'isAvailable'
    return toObservable(store.loadingStatus.checkName, {injector}).pipe(
      filter((loading) => !loading), // Čekaj da završi
      take(1),
      map(() => (store.isAvailable() ? null : {nameTaken: true})),
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
    const stocksChanged = hasArrayChanges(initialArticle.stocks || [], group.get('initialStocks')?.getRawValue() || [], ['quantity', 'expirationDate', 'batchNumber']);
    const compositionChanged = hasArrayChanges(initialArticle.composition || [], group.get('components')?.getRawValue() || [], ['articleId', 'quantity']);
    const barcodesChanged = hasStringArrayChanges(initialArticle.barcodes || [], group.get('barcodes')?.getRawValue() || [])
    // Ako je bilo šta promenjeno, vraćamo null (validno), inače grešku noChanges
    return (fieldsChanged || imageChanged || stocksChanged || compositionChanged || barcodesChanged) ? null : {noChanges: true};
  };
}

function hasStringArrayChanges(source: string[], destination: string[]): boolean {
  // 1. Ako dužine nisu iste, odmah znamo da ima promene
  if (source.length !== destination.length) return true;

  // 2. Sortiranje (opciono, ali preporučeno)
  // Ako ti redosled barkodova nije bitan u bazi, sortiraj ih da izbegneš lažne promene
  const s1 = [...source].sort();
  const s2 = [...destination].sort();

  // 3. Provera svakog elementa
  return s1.some((val, index) => val !== s2[index]);
}


function hasArrayChanges<T>(
  source: T[],
  destination: T[],
  keys: (keyof T)[] // Ključevi se prosleđuju dinamički u runtime-u
): boolean {
  // Brza provera dužine
  if (source.length !== destination.length) return true;

  // Provera svakog elementa na osnovu prosleđenih ključeva
  return source.some((sourceItem, index) => {
    const destItem = destination[index];

    // Vrati true ako bar jedan ključ na ovom objektu ne odgovara
    return keys.some(key => {
      const val1 = sourceItem[key];
      const val2 = destItem[key];

      // Rukovanje datumima (ako je key npr. expirationDate)
      if (val1 instanceof Date && val2 instanceof Date) {
        return val1.getTime() !== val2.getTime();
      }

      return val1 !== val2;
    });
  });
}


export function uniqueValueValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formArray = control as FormArray;
    const values = formArray.controls.map(c => c.value?.trim().toLowerCase());

    // Check if any value is duplicated
    const hasDuplicates = values.some((val, index) => val && values.indexOf(val) !== index);

    return hasDuplicates ? {duplicateValue: true} : null;
  };
}

export const eanValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  // Ako je prazno, preskačemo (za to služi Validators.required)
  if (!value) return null;

  const code = value.toString();

  // 1. Provera formata: samo cifre, dužina tačno 8 ili 13
  if (!/^\d{8}$|^\d{13}$/.test(code)) {
    return {eanFormat: true};
  }

  // 2. Modulo 10 kalkulacija
  const digits: number[] = code.split('').map(Number);
  const checkDigit = digits.pop();
  let sum = 0;

  digits.forEach((digit, index) => {
    if (code.length === 13) {
      // EAN-13: pozicije 0,2,4.. (faktor 1), pozicije 1,3,5.. (faktor 3)
      sum += (index % 2 === 0) ? digit : digit * 3;
    } else {
      // EAN-8: pozicije 0,2,4.. (faktor 3), pozicije 1,3,5.. (faktor 1)
      sum += (index % 2 === 0) ? digit * 3 : digit;
    }
  });

  const calculatedCheck = (10 - (sum % 10)) % 10;

  return calculatedCheck === checkDigit ? null : {eanChecksum: true};
};



