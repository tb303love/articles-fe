import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // 1. SIGNALI - Glavni izvor istine za status prijave
  // Inicijalizujemo iz localStorage-a da korisnik ostane ulogovan nakon osvežavanja (F5)
  private accessTokenSignal = signal<string | null>(localStorage.getItem('access_token'));

  // 2. COMPUTED SIGNALI - Automatski se osvežavaju kada se promeni accessTokenSignal
  isAuthenticated = computed(() => !!this.accessTokenSignal());

  username = computed(() => {
    const token = this.accessTokenSignal();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub; // 'sub' obično čuva username u JWT-u
    } catch {
      return '';
    }
  });

  userRoles: Signal<string[]> = computed(() => {
    const token = this.accessTokenSignal();
    if (!token) return [];
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Dekodovanje JWT payload-a
      return payload.roles || [];
    } catch {
      return [];
    }
  });

  isAdmin = computed(() => this.userRoles().includes('ROLE_ADMIN'));

  // 3. LOGIN - Pokreće promenu signala
  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((res) => {
        this.saveTokens(res.accessToken, res.refreshToken);
        // Postavljanjem signala, ceo UI koji zavisi od isAuthenticated() se trenutno osvežava
        this.accessTokenSignal.set(res.accessToken);
      }),
    );
  }

  logout() {
    // 1. Obavesti bekhend da obriše refresh token iz baze
    this.http
      .post(`${this.API_URL}/logout`, {})
      .pipe(mergeMap(() => this.clearSession()))
      .subscribe({
        error: () => this.clearSession(), // Čistimo lokalno čak i ako je bekhend nedostupan
      });
  }

  private clearSession() {
    // 2. Čišćenje storage-a
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // 3. Ažuriranje signala (Ovo automatski menja Navbar i izbacuje korisnika sa zaštićenih ruta)
    this.accessTokenSignal.set(null);

    // 4. Povratak na login
    return this.router.navigate(['/login']);
  }

  // 4. REFRESH - Poziva ga Interceptor kada access token istekne
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap((res) => {
        localStorage.setItem('access_token', res.accessToken);
        this.accessTokenSignal.set(res.accessToken);
      }),
    );
  }

  // Pomoćne metode
  private saveTokens(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }
}
