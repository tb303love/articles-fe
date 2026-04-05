import { CommonModule, KeyValuePipe } from '@angular/common';
import { Component, ElementRef, input, output, viewChild, viewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectedSalesArticle } from '../core/model';
import { NumberSpinner } from '../number-spinner/number-spinner';
import { ConfirmDirective } from '../shared/directives';

@Component({
  selector: 'app-cart-list',
  standalone: true,
  imports: [
    CommonModule,
    KeyValuePipe,
    MatButtonModule,
    MatIconModule,
    NumberSpinner,
    ConfirmDirective,
  ],
  templateUrl: './cart-list.html',
  styleUrl: './cart-list.scss',
})
export class CartList {
  // Primamo podatke iz Sales komponente
  articles = input.required<Map<number, SelectedSalesArticle>>();
  success$ = input<any>();

  // Emisija događaja ka Sales komponenti
  remove = output<SelectedSalesArticle>();
  clear = output<void>();
  quantityChange = output<{ quantity: number; id: number }>();

  // ViewChildren koje Sales "posmatra"
  readonly spinners = viewChildren(NumberSpinner);

  // Referenca na dugme sa dijalogom (za Shift+Delete prečicu)
  private clearCartBtn = viewChild('clearCartBtn', { read: ElementRef<HTMLButtonElement> });

  // Metoda koju Sales poziva spolja
  public triggerClearWithConfirmation() {
    const btn = this.clearCartBtn();
    if (btn && this.articles().size > 0) {
      btn.nativeElement.click();
    }
  }
}
