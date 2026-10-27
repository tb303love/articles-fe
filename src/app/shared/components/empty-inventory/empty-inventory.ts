import {ChangeDetectionStrategy, Component, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-empty-inventory',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './empty-inventory.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './empty-inventory.scss',
})
export class EmptyInventory {
  // Komponenta je "glupa" - roditelj odlučuje šta znači dodavanje/uvoz
  readonly addArticle = output<void>();
  readonly importExcel = output<void>();
}
