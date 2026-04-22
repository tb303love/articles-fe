import {Injector} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Observable, of} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';
import {ImportConfirmDialog} from '../../import-confirm-dialog/import-confirm-dialog';
import {ArticleStore} from '../../store/article.store';
import {FileActionHandler} from '../model';
import {ArticlesApiService} from '../services/articles-api-service';
import {FileReaderService} from '../services/file-reader';

/**
 * Factory funkcija koja kreira handler za uvoz artikala.
 * Prima servise kao argumente jer factory funkcija nije klasa.
 */
export const createExcelImportHandler = (injector: Injector): FileActionHandler => {
  const api = injector.get(ArticlesApiService);
  const store = injector.get(ArticleStore);
  const dialog = injector.get(MatDialog); // Ili preko injectora

  return {
    extensions: ['.xlsx', '.xls'],
    label: 'Artikli (Excel)',
    icon: 'table_chart',
    color: 'green',
    run: (file: File): Observable<boolean> => {
      const existingNames = store.articles().map((a: any) => a.name);

      return api.analyzeExcel(file, existingNames).pipe(
        switchMap((result) => {
          const confirmRef = dialog.open(ImportConfirmDialog, {
            data: { stats: result.stats, fileName: file.name },
          });
          return confirmRef.afterClosed();
        }),
        switchMap((confirmed) => {
          if (confirmed) {
            return api.executeBulkImport(file).pipe(
              tap(() => store.loadAll('')),
              map(() => true),
            );
          }
          return of(false); // Korisnik otkazao confirm, ostajemo u browseru
        }),
      );
    },
  };
};

/**
 * Primer drugog handlera (npr. za slike artikala)
 */
export const createImageUploadHandler = (injector: Injector): FileActionHandler => ({
  extensions: ['.jpg', '.png', '.webp'],
  label: 'Slika artikla',
  icon: 'image',
  color: '#1a237e',
  run: (file: File) => {
    const fileReaderService = injector.get(FileReaderService);
    fileReaderService.readImage(file);
    return new Observable((sub) => {
      sub.next(true);
      sub.complete();
    });
  },
});
