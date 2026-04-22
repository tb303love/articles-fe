import {HttpClient, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {exhaustMap, from, map, Observable, of, switchMap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ImportErrorsDialog} from '../../shared/components/import-errors-dialog/import-errors-dialog';
import {ArticleResponse} from '../model';

@Injectable({
  providedIn: 'root',
})
export class ArticlesApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/articles`;
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  analyzeExcel(file: File, existingNames: string[]): Observable<any> {
    return from(file.arrayBuffer()).pipe(
      switchMap((buffer) => this.runWorker(buffer, existingNames)),
    );
  }

  executeBulkImport(file: File): Observable<any> {
    return from(file.arrayBuffer()).pipe(
      switchMap((buffer) => this.runWorker(buffer)), // Ovde ne moramo slati existingNames ako ih ne koristimo za logiku uvoza
      switchMap((result) => {
        const validCount = result.articles?.length || 0;
        const errorCount = result.errors?.length || 0;

        // Prikaži greške ako postoje
        if (errorCount > 0) {
          this.showImportReport(result.errors);
        }

        if (validCount > 0) {
          const mappedArticles = result.articles;

          return this.httpClient.post(`${this.baseUrl}/bulk-import`, mappedArticles).pipe(
            map((res) => {
              this.handleImportFeedback(validCount, errorCount);
              return res;
            }),
          );
        } else {
          this.snackBar.open('Nema validnih artikala za uvoz.', 'Zatvori', {
            panelClass: ['snackbar-error'],
          });
          return from([null]);
        }
      }),
    );
  }

  getArticles(searchTerm?: string): Observable<ArticleResponse[]> {
    let params = new HttpParams();
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    return this.httpClient.get<ArticleResponse[]>(this.baseUrl, {params});
  }

  checkArticleName(articleName: string) {
    return this.httpClient.get<boolean>(`${this.baseUrl}/check-article-name`, {
      params: {articleName},
    });
  }

  checkArticleNameButExcludeCurrent(articleName: string, id: number) {
    return this.httpClient.get<boolean>(`${this.baseUrl}/check-article-name-exclude-current`, {
      params: {articleName, id},
    });
  }

  addNewArticle(request: FormData): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}`, request, {
      observe: 'events',
      reportProgress: true,
    });
  }

  deleteArticle(id: number): Observable<any> {
    return of(null).pipe(exhaustMap(() => this.httpClient.delete(`${this.baseUrl}/${id}`)));
  }

  updateArticle(id: number, request: FormData): Observable<any> {
    return this.httpClient.patch<any>(`${this.baseUrl}/${id}`, request, {
      observe: 'events',
      reportProgress: true,
    });
  }

  writeOffArticleStock(id: number): Observable<any> {
    return this.httpClient.delete(`${this.baseUrl}/stock/${id}`);
  }

  getAffectedBundles(id: number): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.baseUrl}/stock/${id}/affected-bundles`);
  }

  /**
   * POMOĆNA FUNKCIJA: Pokreće worker sa datim bufferom i podacima
   */
  private runWorker(buffer: ArrayBuffer, existingNames: string[] = []): Observable<any> {
    return new Observable((observer) => {
      const worker = new Worker(new URL('../../excel-parser.worker', import.meta.url));

      worker.onmessage = ({data}) => {
        if (data.success) {
          observer.next(data);
          observer.complete();
        } else {
          observer.error(data.error);
        }
        worker.terminate();
      };

      worker.onerror = (err) => {
        observer.error('Kritična greška u Web Workeru.');
        worker.terminate();
      };

      // Transferable objekat: buffer šaljemo bez kopiranja u memoriji
      worker.postMessage({buffer, existingNames}, [buffer]);
    });
  }

  private handleImportFeedback(valid: number, skipped: number) {
    let message = `Uspešan uvoz! Dodato: ${valid}`;
    let panel = 'snackbar-success';

    if (valid === 0) {
      message = 'Nijedan artikal nije uvezen. Proverite greške.';
      panel = 'snackbar-error';
    } else if (skipped > 0) {
      message = `Delimično uspešno: ${valid} uvezeno, ${skipped} preskočeno.`;
      panel = 'snackbar-warning';
    }

    this.snackBar.open(message, 'OK', {duration: 5000, panelClass: [panel]});
  }

  private showImportReport(errors: any[]): void {
    this.dialog.open(ImportErrorsDialog, {
      data: {errors},
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
    });
  }
}
