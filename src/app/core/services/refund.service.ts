import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.production';
import { Refund } from '../model';

@Injectable({ providedIn: 'root' })
export class RefundService {
  private apiUrl = `${environment.apiUrl}/refunds`;

  constructor(private http: HttpClient) {}

  processRefund(orderId: number): Observable<Refund> {
    return this.http.post<Refund>(`${this.apiUrl}/${orderId}`, null);
  }
}
