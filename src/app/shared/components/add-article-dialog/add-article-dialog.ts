import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, computed, DestroyRef, inject, Injector, OnDestroy, signal,} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, ReactiveFormsModule} from '@angular/forms';
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
import {filter, map, tap} from 'rxjs';
import {FileBrowserData, SalesArticle} from '../../../core/model';
import {ArticleFormGroup} from '../../../core/model/article-form.model';
import {FileReaderService} from '../../../core/services/file-reader';
import {createImageUploadHandler} from '../../../core/utils/file-handlers';
import {ArticleStore} from '../../../store';
import {CategoryStore} from '../../../store/category.store';
import {FloatInputDirective} from '../../directives';
import {mapFormControlsToFormData} from '../../mappers/mapArticleControlsToFormData';
import {FileBrowser} from '../file-browser/file-browser';
import initializeForm, {newBarCodeField} from './add-article-form-logic';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {BundleComponents} from './bundle-components/bundle-components';
import {InitialStocks} from './initial-stocks/initial-stocks';
import {mergeMap} from 'rxjs/operators';

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
    BundleComponents,
    InitialStocks,

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
        map(({image, event}) => {
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
          return true;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((changes) => {
        this.cdr.detectChanges()
      });
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
      this.components.enable();      // Omogući komponente
      this.initialStocks.disable();  // Onemogući zalihe (neće biti u .value)
    } else {
      this.components.disable();     // Onemogući komponente
      this.initialStocks.enable();   // Omogući zalihe
    }
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
