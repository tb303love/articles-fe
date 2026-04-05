import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { exhaustMap } from 'rxjs';
import { ArticlesApiService } from '../core/services/articles-api-service';
import { AuthService } from '../core/services/auth-service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule, // Dodato za mat-form-field
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private articleService = inject(ArticlesApiService);
  private router = inject(Router);

  errorMessage: string = '';
  hide = true; // Kontrola za prikaz/skrivanje lozinke

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.requestSafeFullScreen();
      this.authService
        .login(this.loginForm.value)
        .pipe(
          exhaustMap(() =>
            this.authService.isAdmin()
              ? this.router.navigate(['/artikli'])
              : this.router.navigate(['/prodaja']),
          ),
        )
        .subscribe({
          error: (err) => {
            this.errorMessage = 'Neispravno korisničko ime ili lozinka.';
            console.error(err);
          },
        });
    }
  }

  private requestSafeFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn(`Greška pri ulasku u FS: ${err.message}`);
      });
    }
  }
}
