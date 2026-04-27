import {DatePipe} from '@angular/common';
import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {RouterLink} from '@angular/router';
import {AuthService} from '../core/services/auth-service';
import {ArticleStore} from '../store/article/article.store';

@Component({
  selector: 'app-navigation',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink, DatePipe],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly articleStore = inject(ArticleStore);
  protected currentTime = signal(new Date());
  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  onLogout() {
    this.auth.logout(); // Poziva tvoju novu logout logiku
    // AuthService će unutar logout-a uraditi redirekciju,
    // ali možeš i ovde eksplicitno ako želiš.
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  protected links = [
    { label: 'Artikli', path: '/artikli', isActive: true },
    { label: 'Prodaja', path: '/prodaja', isActive: false },
  ];
}
