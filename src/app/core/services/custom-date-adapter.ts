import { NativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';
import { MatDateFormats } from '@angular/material/core';

export const MY_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'DD.MM.YYYY.', // Kako prepoznaje unos
  },
  display: {
    dateInput: 'DD.MM.YYYY.', // Kako prikazuje u polju
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  
  // Kontroliše kako se datum prikazuje u samom input polju
  override format(date: Date, displayFormat: Object): string {
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}.${month}.${year}.`; // Format: 30.04.2026.
  }

  // OVO JE NAJBITNIJE: Kontroliše šta JSON.stringify šalje na backend
  serialize(date: Date): string | null {
    if (date) {
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      return `${year}-${month}-${day}`; // Šalje "2026-04-30" - savršeno za LocalDate
    }
    return null;
  }
}
