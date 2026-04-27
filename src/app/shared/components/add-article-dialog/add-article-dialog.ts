import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, computed, DestroyRef, inject, Injector, OnDestroy, signal,} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef,} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {filter, tap} from 'rxjs';
import {FileBrowserData, SalesArticle} from '../../../core/model';
import {ArticleFormGroup} from '../../../core/model/article-form.model';
import {ArticlesApiService} from '../../../core/services/articles-api-service';
import {FileReaderService} from '../../../core/services/file-reader';
import {createImageUploadHandler} from '../../../core/utils/file-handlers';
import {ArticleStore} from '../../../store/article/article.store';
import {CategoryStore} from '../../../store/category.store';
import {FloatInputDirective} from '../../directives';
import {mapFormControlsToFormData} from '../../mappers/mapArticleControlsToFormData';
import {FileBrowser} from '../file-browser/file-browser';
import initializeForm, {createComponentGroup, createStockGroup, newBarCodeField} from './add-article-form-logic';
import {
  StockWriteOffWarningDialog,
  WriteOffWarningData
} from '../stock-write-off-warning-dialog/stock-write-off-warning-dialog';
import {MatSlideToggle} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-add-article-dialog',
  templateUrl: './add-article-dialog.html',
  styleUrls: ['./add-article-dialog.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    FloatInputDirective,
    MatSlideToggle,
  ],
  providers: [provideNativeDateAdapter()],
})
export class AddArticleDialog implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<AddArticleDialog>);
  protected readonly dialogData: SalesArticle | null = inject(MAT_DIALOG_DATA);
  protected readonly articleStore = inject(ArticleStore);
  private readonly fileReaderService = inject(FileReaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  protected readonly categoryStore = inject(CategoryStore);
  private articleService = inject(ArticlesApiService);

  // Signali
  protected readonly isBundle = signal(false);
  protected readonly formReady = signal(false);
  protected readonly imagePreview = this.fileReaderService.imagePreview;
  isEditMode = computed(() => !!this.dialogData?.id);

  // Unutar klase komponente:
  private readonly categorySearchTerm = signal<string>('');

  // Computed lista koja filtrira kategorije na osnovu onoga što je ukucano
  filteredCategories = computed(() => {
    const term = this.categorySearchTerm().toLowerCase();
    const allCategories = this.categoryStore.sortedNames(); // tvoj postojeći signal

    if (!term) return allCategories;

    return allCategories.filter(cat =>
      cat.toLowerCase().includes(term)
    );
  });

  protected onCategoryTyping(event: Event) {
    const input = event.target as HTMLInputElement;
    this.categorySearchTerm.set(input.value);
  }

  protected newArticleForm!: ArticleFormGroup;

  get initialStocks(): FormArray {
    return this.newArticleForm?.get('initialStocks') as FormArray;
  }

  get components(): FormArray {
    return this.newArticleForm?.get('components') as FormArray;
  }

  get barcodes(): FormArray {
    return this.newArticleForm?.get('barcodes') as FormArray;
  }

  constructor() {
    this.fileReaderService.initializeWorker();
    this.fileReaderService.loadImage(this.dialogData);
    this.categoryStore.loadAll();

    this.fileReaderService
      .getFile()
      .pipe(
        filter((dto) => dto.state === 'loaded'),
        tap(({image, event}) => {
          if (event === 'load') {
            this.newArticleForm = initializeForm(
              this.dialogData,
              this.articleStore,
              this.injector,
              image,
            );

            if (this.dialogData?.composition && this.dialogData.composition.length > 0) {
              this.isBundle.set(true);
            }

            this.formReady.set(true);
          } else {
            this.newArticleForm.patchValue({image}, {emitEvent: true});
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.cdr.detectChanges());
  }

  protected checkAndWriteOff(stock: any) {
    // Pozivamo endpoint koji smo napravili u ArticleStore-u / Servisu
    this.articleService.getAffectedBundles(stock.id).subscribe(affectedBundles => {

      const dialogRef = this.dialog.open(StockWriteOffWarningDialog, {
        width: '450px',
        autoFocus: false,
        data: {
          affectedBundles: affectedBundles,
          stockQuantity: stock.quantity
        } as WriteOffWarningData
      });

      dialogRef.afterClosed().pipe(
        filter(confirmed => !!confirmed)
      ).subscribe(() => {
        // Izvršavamo brisanje na backendu
        this.articleStore.writeOffArticleStock(stock.id);

        // Lokalno ažuriramo listu da korisnik odmah vidi promenu
        if (this.dialogData) {
          this.dialogData.stocks = this.dialogData.stocks.filter(s => s.id !== stock.id);
        }
      });
    });
  }


  // Dodavanje nove prazne komponente u niz
  protected addComponent() {
    if (this.components) {
      // createComponentGroup smo uvezli iz tvog add-article-form-logic
      this.components.push(createComponentGroup(this.articleStore));
      this.cdr.detectChanges();
    }
  }

  // Brisanje komponente po indeksu
  protected removeComponent(index: number) {
    this.components.removeAt(index);
  }

  // Logika za autocomplete pretragu artikala koji mogu biti komponente
  protected getFilteredArticles(index: number) {
    // Uzimamo trenutnu vrednost iz polja 'name' za tu komponentu
    const control = this.components.at(index).get('name');
    const searchValue = (control?.value || '').toString().toLowerCase();

    return this.articleStore.articles().filter(
      (art) =>
        // 1. Naziv se poklapa
        art.name.toLowerCase().includes(searchValue) &&
        // 2. Ne dozvoljavamo da artikal sadrži samog sebe (ako je u Edit modu)
        art.id !== this.dialogData?.id &&
        // 3. Ne nudimo druge artikle koji su već Bundle (da izbegnemo preveliku dubinu)
        (art.composition === null || art.composition.length === 0),
    );
  }

  // Kada korisnik klikne na artikal iz autocomplete liste
  protected onComponentSelected(event: any, index: number) {
    const selectedName = event.option.value;
    const article = this.articleStore.articles().find((a) => a.name === selectedName);

    if (article) {
      const group = this.components.at(index);
      // Upisujemo ID koji je ključan za slanje na backend
      group.get('componentId')?.setValue(article.id);

      // Opciono: Ažuriramo validaciju da količina ne može biti veća od dostupne u magacinu
      group.get('quantity')?.setValidators([Validators.required, Validators.min(1)]);
      group.get('quantity')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.newArticleForm.invalid) return;
    const value = mapFormControlsToFormData(this.newArticleForm.controls);

    if (this.dialogData) {
      this.articleStore.updateArticle(this.dialogData.id, value);
    } else {
      this.articleStore.createArticle(value);
    }

    this.articleStore
      .operationSuccess$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close());
  }

  openFileExplorer() {
    this.dialog.open(FileBrowser, {
      width: '750px',
      data: {
        title: 'Arhiva dokumenata',
        handlers: [createImageUploadHandler(this.injector)],
      } as FileBrowserData,
    });
  }

  protected toggleBundle(checked: boolean) {
    this.isBundle.set(checked);
    if (checked) {
      // Ako postane bundle, očisti sve započete unose zaliha
      this.initialStocks.clear();
    } else {
      // Ako prestane da bude bundle, očisti komponente
      this.components.clear();
    }
  }

  protected addStock() {
    if (this.initialStocks) {
      this.initialStocks.push(createStockGroup());
      this.cdr.detectChanges(); // Forsiraj osvežavanje HTML-a
    }
  }

  protected removeStock(index: number) {
    this.initialStocks.removeAt(index);
  }

  protected removeImage(event: Event) {
    event.stopPropagation();
    this.fileReaderService.removeImage();
    this.newArticleForm.patchValue({image: null});
  }

  ngOnDestroy() {
    this.fileReaderService.terminateWorker();
  }

  protected addNewBarcode() {
    if (this.barcodes) {
      this.barcodes.push(newBarCodeField());
    }
  }
}
