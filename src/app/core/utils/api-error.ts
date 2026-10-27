import {HttpContextToken, HttpErrorResponse} from '@angular/common/http';

/**
 * Zahtev koji sam prikazuje grešku (npr. login u formi) postavlja ovaj token,
 * pa generički interceptor ne prikazuje dodatni snackbar:
 * `http.post(url, body, {context: new HttpContext().set(SILENT_ERROR, true)})`
 */
export const SILENT_ERROR = new HttpContextToken<boolean>(() => false);

/** Naslovi po statusu kada server ne pošalje poruku (ili je greška van servera) */
const PODRAZUMEVANE_PORUKE: Record<number, string> = {
  400: 'Neispravan zahtev.',
  401: 'Prijava je istekla. Prijavite se ponovo.',
  404: 'Traženi podatak ne postoji.',
  409: 'Podaci su u sukobu sa postojećim stanjem.',
  413: 'Zahtev je prevelik.',
  500: 'Greška na serveru.',
};

/** Backend uvek šalje `{ "message": "..." }` (ApiError) - ovo je jedino mesto koje zna taj oblik */
export function apiErrorMessage(err: unknown, fallback?: string): string {
  if (err instanceof HttpErrorResponse) {
    const poruka = err.error?.message;
    if (typeof poruka === 'string' && poruka.trim()) {
      return poruka;
    }
    return fallback ?? PODRAZUMEVANE_PORUKE[err.status] ?? 'Došlo je do greške.';
  }
  return fallback ?? 'Došlo je do greške.';
}
