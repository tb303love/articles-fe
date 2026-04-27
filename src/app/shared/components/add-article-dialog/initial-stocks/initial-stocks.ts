import {Component, inject} from '@angular/core';
import {FormArray, FormGroupDirective, ReactiveFormsModule} from '@angular/forms';
import {createStockGroup} from '../add-article-form-logic';
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
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './initial-stocks.html',
  styleUrl: './initial-stocks.scss',
})
export class InitialStocks {
  private rootFormGroup = inject(FormGroupDirective);

  get parentForm() {
    return this.rootFormGroup.form;
  }

  get stocks() {
    return this.parentForm.get('initialStocks') as FormArray;
  }

  addStock() {
    this.stocks.push(createStockGroup());
  }

  removeStock(index: number) {
    this.stocks.removeAt(index);
  }
}
