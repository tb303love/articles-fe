import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../model';

@Injectable({
  providedIn: 'root',
})
export class CategoryApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  public getCategoryNames(): Observable<Category[]> {
    return this.httpClient.get<Category[]>(`${this.apiUrl}`);
  }
}
