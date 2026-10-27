import {Component, input, ChangeDetectionStrategy} from '@angular/core';
import {FieldTree, FormField} from '@angular/forms/signals';
import {createStock} from '../add-article-form-logic';
import {StockFormModel} from '../../../../core/model/article-form.model';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatButtonModule} from '@angular/material/button';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-initial-stocks',
  imports: [
    CommonModule,
    FormField,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './initial-stocks.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './initial-stocks.scss',
})
export class InitialStocks {
  readonly stocks = input.required<FieldTree<StockFormModel[]>>();

  addStock() {
    this.stocks()().value.update((stocks) => [...stocks, createStock()]);
  }

  removeStock(index: number) {
    this.stocks()().value.update((stocks) => stocks.filter((_, i) => i !== index));
  }
}
