import {SalesArticle} from '../core/model';
import {ArticleFormModel} from '../core/model/article-form.model';

export const MAX_IMAGE_SIZE = 16777216;

export function isImageTooLarge(file: File | null): boolean {
  return !!file && file.size > MAX_IMAGE_SIZE;
}

/**
 * Da li se trenutna vrednost forme razlikuje od početnog artikla (edit mod).
 */
export function hasArticleChanges(
  initialArticle: SalesArticle,
  value: ArticleFormModel,
  initialFile: File | null,
): boolean {
  // 1. Provera osnovnih polja
  const fieldsChanged =
    value.name !== initialArticle.name ||
    value.price !== initialArticle.price ||
    value.active !== initialArticle.active ||
    value.admissionPrice1 !== initialArticle.admissionPrice1 ||
    value.admissionPrice2 !== initialArticle.admissionPrice2 ||
    (value.category || null) !== initialArticle.category;

  // 2. Provera slike
  const imageChanged = value.image !== initialFile;
  const stocksChanged = hasArrayChanges(
    initialArticle.stocks || [],
    value.initialStocks,
    ['quantity', 'expirationDate', 'batchNumber'],
  );
  const compositionChanged = hasArrayChanges(
    (initialArticle.composition || []).map(c => ({componentId: c.articleId, quantity: c.quantity})),
    value.components,
    ['componentId', 'quantity'],
  );
  const barcodesChanged = hasStringArrayChanges(initialArticle.barcodes || [], value.barcodes);

  return fieldsChanged || imageChanged || stocksChanged || compositionChanged || barcodesChanged;
}

function hasStringArrayChanges(source: string[], destination: string[]): boolean {
  // 1. Ako dužine nisu iste, odmah znamo da ima promene
  if (source.length !== destination.length) return true;

  // 2. Sortiranje - redosled barkodova nije bitan, pa izbegavamo lažne promene
  const s1 = [...source].sort();
  const s2 = [...destination].sort();

  // 3. Provera svakog elementa
  return s1.some((val, index) => val !== s2[index]);
}

function hasArrayChanges<K extends string>(
  source: Partial<Record<K, unknown>>[],
  destination: Partial<Record<K, unknown>>[],
  keys: K[],
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

      return (val1 ?? null) !== (val2 ?? null);
    });
  });
}

export function hasDuplicateValues(values: string[]): boolean {
  const normalized = values.map(v => v?.trim().toLowerCase());
  return normalized.some((val, index) => val && normalized.indexOf(val) !== index);
}

/**
 * Proverava EAN-8 / EAN-13 barkod. Vraća vrstu greške ili null ako je validan.
 */
export function eanError(value: string): 'eanFormat' | 'eanChecksum' | null {
  // Ako je prazno, preskačemo (za to služi required)
  if (!value) return null;

  const code = value.toString();

  // 1. Provera formata: samo cifre, dužina tačno 8 ili 13
  if (!/^\d{8}$|^\d{13}$/.test(code)) {
    return 'eanFormat';
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

  return calculatedCheck === checkDigit ? null : 'eanChecksum';
}
