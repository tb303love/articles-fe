import {
    ChangeDetectorRef,
    Component,
    DestroyRef,
    inject,
    Injector,
    OnDestroy,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { filter, tap } from 'rxjs';
import { FileBrowserData, SalesArticle } from '../../../core/model';
import { ArticleFormGroup, ComponentFormGroup } from '../../../core/model/article-form.model';
import { CategoryApiService } from '../../../core/services/category-api-service';
import { FileReaderService } from '../../../core/services/file-reader';
import { createImageUploadHandler } from '../../../core/utils/file-handlers';
import { ArticleStore } from '../../../store/article.store';
import { CategoryStore } from '../../../store/category.store';
import { FloatInputDirective } from '../../directives/float-input-directive';
import { mapFormControlsToFormData } from '../../mappers/mapArticleControlsToFormData';
import { FileBrowser } from '../file-browser/file-browser';
import initializeForm, { createComponentGroup, createStockGroup } from './add-article-form-logic';

@Component({
  selector: 'app-add-article-dialog',
  templateUrl: './add-article-dialog.html',
  styleUrls: ['./add-article-dialog.scss'],
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    FloatInputDirective,
    MatAutocompleteModule,
    MatProgressSpinner,
    MatProgressBarModule,
    MatCheckboxModule,
    MatSelectModule,
    MatExpansionModule,
    MatDividerModule,
  ],
  providers: [CategoryApiService],
})
export class AddArticleDialog implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<AddArticleDialog>);
  protected readonly dialogData: SalesArticle | null = inject(MAT_DIALOG_DATA);
  protected readonly isEditMode = signal(this.dialogData !== null);
  protected readonly articleStore = inject(ArticleStore);
  private readonly fileReaderService = inject(FileReaderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  protected readonly isBundle = signal(false);
  protected readonly categoryStore = inject(CategoryStore);
  private readonly injector = inject(Injector);
  protected newArticleForm!: ArticleFormGroup;

  protected imagePreview = this.fileReaderService.imagePreview;

  get components() {
    return this.newArticleForm.get('components') as FormArray<ComponentFormGroup>;
  }

  constructor() {
    this.fileReaderService.initializeWorker();
    this.fileReaderService.loadImage(this.dialogData);
    this.fileReaderService
      .getFile()
      .pipe(
        filter((dto) => dto.state === 'loaded'),
        tap(({ image, event }) => {
          if (event === 'load') {
            this.newArticleForm = initializeForm(
              this.dialogData,
              this.articleStore,
              this.injector,
              image,
            );
          } else {
            this.newArticleForm.patchValue({ image });
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.cdr.detectChanges();
      });
    this.categoryStore.loadAll();
  }

  openFileExplorer() {
    const handlers = [createImageUploadHandler(this.injector)];

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

  onSubmit() {
    const value = mapFormControlsToFormData(this.newArticleForm.controls);

    if (this.dialogData) {
      this.articleStore.updateArticle(this.dialogData.id, value);
    } else {
      this.articleStore.createArticle(value);
    }

    this.articleStore
      .operationSuccess$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.dialogRef.close();
      });
  }

  protected removeImage(event: Event) {
    event.stopPropagation();
    this.fileReaderService.removeImage();
    this.newArticleForm.patchValue({
      image: null,
    });
  }

  protected toggleBundle(checked: boolean) {
    if (checked) {
      // 1. Ako je bundle, dodaj prvu komponentu ako je lista prazna
      if (this.components.length === 0) this.addComponent(); 
      
      // 2. ISPRAVKA: Čistimo sve unete serije zaliha jer bundle nema svoj lager
      this.initialStocks.clear(); 
      
      this.isBundle.set(true);
    } else {
      // 3. Ako isključimo bundle, čistimo komponente
      this.components.clear();
      
      // 4. ISPRAVKA: Dodajemo jedan prazan red za unos zaliha i rokova (initialStocks)
      if (this.initialStocks.length === 0) {
        this.initialStocks.push(createStockGroup());
      }
      
      this.isBundle.set(false);
    }
  }
  
  // Pomoćni getter za lakši pristup initialStocks nizu
  get initialStocks() {
    return this.newArticleForm.controls.initialStocks;
  }

  protected addStock() {
    this.initialStocks.push(createStockGroup());
  }

  protected removeComponent(index: number) {
    this.newArticleForm.controls.components.removeAt(index);
  }

  protected addComponent() {
    const group = createComponentGroup(this.articleStore);
    this.components.push(group);
  }

  ngOnDestroy(): void {
    this.fileReaderService.terminateWorker();
  }
}
