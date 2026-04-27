import {ScrollingModule} from '@angular/cdk/scrolling';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {Component, inject, Injector, OnInit, signal,} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {FileBrowserData, SalesArticle} from '../core/model';
import {createExcelImportHandler} from '../core/utils/file-handlers';
import {AddArticleDialog} from '../shared/components/add-article-dialog/add-article-dialog';
import {FileBrowser} from '../shared/components/file-browser/file-browser';
import {ConfirmDirective, HoverOverlayDirective} from '../shared/directives';
import {ImageDomSanitizerPipe} from '../shared/pipes';
import {ArticleStore} from '../store/article/article.store';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    HoverOverlayDirective,
    ImageDomSanitizerPipe,
    ConfirmDirective,
    CurrencyPipe,
    MatInputModule,
    MatProgressBarModule,
    ScrollingModule,
  ],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss',
})
export class ArticleList implements OnInit {
  protected readonly articlesStore = inject(ArticleStore);
  private readonly dialog = inject(MatDialog);
  private injector = inject(Injector);

  // ... u klasi komponente
  protected showAdmissionPrices = signal(false); // Podrazumevano sakriveno

  // Koristimo computed signal da automatski ažuriramo kolone koje tabela treba da renderuje
  protected toggleAdmissionPrices(): void {
    this.showAdmissionPrices.update((val) => !val);
  }

  ngOnInit() {
    this.clearSearch();
    this.articlesStore.loadAll('');
  }

  protected trackByFn(_: number, item: any): number {
    return item.id; // Unique identifier
  }

  protected clearSearch(): void {
    this.articlesStore.updateFilter(''); // Resetujemo filter u SignalStore-u
  }

  protected openFileExplorer(): void {
    const handlers = [createExcelImportHandler(this.injector)];

    this.dialog.open(FileBrowser, {
      width: '750px',
      maxWidth: '95vw',
      panelClass: 'custom-explorer-dialog', // Za tvoj specifičan CSS
      autoFocus: false,
      restoreFocus: true,
      disableClose: true,
      data: {
        title: 'Arhiva dokumenata',
        subtitle: 'Izaberi fajl za sistemsku akciju',
        handlers: handlers,
      } as FileBrowserData,
    });
  }

  protected openAddArticleDialog(): void {
    this.dialog.open(AddArticleDialog, {
      disableClose: true,
      width: '720px', // Savršena širina za ovaj layout
      maxWidth: '95vw',
      autoFocus: false,
    });
  }

  protected onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.articlesStore.updateFilter(value);
  }

  protected editArticle(article: SalesArticle): void {
    this.dialog.open(AddArticleDialog, {
      disableClose: true,
      data: article,
      width: '720px', // Savršena širina za ovaj layout
      maxWidth: '95vw',
      autoFocus: false,
    });
  }
}
