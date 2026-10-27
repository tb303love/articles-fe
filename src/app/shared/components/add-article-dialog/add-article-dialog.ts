import {CommonModule} from '@angular/common';
import {
   ChangeDetectionStrategy,
   ChangeDetectorRef,
   Component,
   computed,
   DestroyRef,
   inject,
   Injector,
   OnDestroy,
   signal
} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {form, FormField, FormRoot} from '@angular/forms/signals';
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
import {catchError, filter, map, of, race} from 'rxjs';
import {FileBrowserData, SalesArticleWithExtra} from '../../../core/model';
import {ArticleFormModel} from '../../../core/model/article-form.model';
import {ArticlesApiService} from '../../../core/services/articles-api-service';
import {FileReaderService} from '../../../core/services/file-reader';
import {createImageUploadHandler} from '../../../core/utils/file-handlers';
import {ArticleStore} from '../../../store';
import {CategoryStore} from '../../../store/category.store';
import {FloatInputDirective} from '../../directives';
import {mapArticleModelToFormData} from '../../mappers/mapArticleControlsToFormData';
import {FileBrowser} from '../file-browser/file-browser';
import {articleFormSchema, createArticleModel, emptyArticleModel} from './add-article-form-logic';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {BundleComponents} from './bundle-components/bundle-components';
import {InitialStocks} from './initial-stocks/initial-stocks';
import {BarcodeService} from '../../../core/services/barcode.service';
import {mergeMap, tap} from 'rxjs/operators';

@Component({
   selector: 'app-add-article-dialog',
   templateUrl: './add-article-dialog.html',
   styleUrls: ['./add-article-dialog.scss'],
   standalone: true,
   imports: [
      CommonModule,
      FormField,
      FormRoot,
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
   changeDetection: ChangeDetectionStrategy.Eager,
   providers: [provideNativeDateAdapter()],
})
export class AddArticleDialog implements OnDestroy {
   private readonly dialogRef = inject(MatDialogRef<AddArticleDialog>);
   protected readonly dialogData: SalesArticleWithExtra | null = inject(MAT_DIALOG_DATA);
   protected readonly articleStore = inject(ArticleStore);
   private readonly fileReaderService = inject(FileReaderService);
   private readonly cdr = inject(ChangeDetectorRef);
   private readonly destroyRef = inject(DestroyRef);
   private readonly barcodeService = inject(BarcodeService);
   private readonly dialog = inject(MatDialog);
   private readonly injector = inject(Injector);
   protected readonly categoryStore = inject(CategoryStore);
   private readonly articleApi = inject(ArticlesApiService);

   // Signali
   protected readonly formReady = signal(false);
   protected readonly imagePreview = this.fileReaderService.imagePreview;
   protected isEditMode = computed(() => !!this.dialogData?.id);

   // Paket može da se sklopi ako na serveru postoji bar jedan običan artikal sa zalihom (osim ovog).
   // Postojeći paket uvek prikazuje svoje komponente, bez obzira na trenutne zalihe.
   protected readonly canBuildBundle = toSignal(
      this.articleApi.getArticles().pipe(
         map((articles) =>
            (this.dialogData?.composition?.length ?? 0) > 0 ||
            articles.some((a) =>
               a.id !== this.dialogData?.id && a.totalStock > 0 && !a.composition?.length,
            ),
         ),
         catchError(() => of(false)),
      ),
      {initialValue: (this.dialogData?.composition?.length ?? 0) > 0},
   );

   // Slika sa kojom je forma inicijalizovana (za detekciju promena)
   private readonly initialImage = signal<File | null>(null);

   // Model i signal forma
   private readonly articleModel = signal<ArticleFormModel>(emptyArticleModel());
   protected readonly articleForm = form(
      this.articleModel,
      articleFormSchema({
         article: this.dialogData,
         articleApi: this.articleApi,
         initialImage: this.initialImage,
      }),
      {
         submission: {
            ignoreValidators: 'none',
            action: async (field) => {
               this.save(field().value());
               return null;
            },
         },
      },
   );

   // Computed lista koja filtrira kategorije na osnovu onoga što je ukucano
   filteredCategories = computed(() => {
      const term = this.articleForm.category().value().toLowerCase();
      const allCategories = this.categoryStore.sortedNames(); // tvoj postojeći signal

      if (!term) return allCategories;

      return allCategories.filter(cat =>
         cat.toLowerCase().includes(term)
      );
   });

   constructor() {
      this.fileReaderService.initializeWorker();
      this.fileReaderService.loadImage(this.dialogData);
      this.categoryStore.loadAll();

      this.barcodeService.setIsOpenModal(true);

      this.articleStore
         .operationSuccess$()
         .pipe(takeUntilDestroyed(this.destroyRef), tap(console.log))
         .subscribe(() => this.dialogRef.close());

      this.fileReaderService
         .getFile()
         .pipe(
            filter((dto) => dto.state === 'loaded'),
            mergeMap(({image, event}) => {
               if (event === 'load') {
                  this.initialImage.set(image);
                  this.articleModel.set(createArticleModel(this.dialogData, image));
                  this.articleStore.setCurrentEditingArticle(this.dialogData?.id || null);
                  this.formReady.set(true);
               } else {
                  this.articleForm.image().value.set(image);
               }
               // this.barcodeService.inventoryScans$.pipe(
               //   tap(({stock: {quantity, expiryDate}}) => {
               //     this.newArticleForm.controls.initialStocks.push(
               //       createStockGroup(quantity, expiryDate, '')
               //     );
               //   })
               // )
               return race(this.barcodeService.inventoryScans$, this.barcodeService.newArticle$)
            }),
            takeUntilDestroyed(this.destroyRef),
         )
         .subscribe((update) => {
            console.log("Update", update);
            this.cdr.detectChanges();
         });
   }

   private save(model: ArticleFormModel) {
      const value = mapArticleModelToFormData(model);

      if (this.dialogData && this.dialogData?.id) {
         this.articleStore.updateArticle(this.dialogData.id, value);
      } else {
         this.articleStore.createArticle(value);
      }
   }

   protected openFileExplorer() {
      this.dialog.open(FileBrowser, {
         width: '750px',
         data: {
            title: 'Arhiva dokumenata',
            handlers: [createImageUploadHandler(this.injector)],
         } as FileBrowserData,
      });
   }

   protected removeImage(event: Event) {
      event.stopPropagation();
      this.fileReaderService.removeImage();
      this.articleForm.image().value.set(null);
   }

   ngOnDestroy() {
      this.fileReaderService.terminateWorker();
      this.articleStore.setCurrentEditingArticle(null);
      this.barcodeService.setIsOpenModal(false);
   }

   protected addNewBarcode() {
      this.articleForm.barcodes().value.update((barcodes) => [...barcodes, '']);
   }

   protected removeBarcode(index: number) {
      this.articleForm.barcodes().value.update((barcodes) => barcodes.filter((_, i) => i !== index));
   }
}
