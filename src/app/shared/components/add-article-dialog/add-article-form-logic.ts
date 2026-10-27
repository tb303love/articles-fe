import {Signal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {
  applyEach,
  applyWhen,
  max,
  min,
  required,
  schema,
  validate,
  validateAsync,
} from '@angular/forms/signals';
import {SalesArticleWithExtra} from '../../../core/model';
import {
  ArticleFormModel,
  ComponentFormModel,
  StockFormModel,
} from '../../../core/model/article-form.model';
import {ArticlesApiService} from '../../../core/services/articles-api-service';
import {eanError, hasArticleChanges, hasDuplicateValues, isImageTooLarge} from '../../form-validators';
import {ObjectUtils} from '../../../core/utils/util';
import {isStockAvailable} from './add-edit-article-util';

/**
 * Kreira jednu seriju zaliha (Stock Batch)
 */
export function createStock(
  qty: number = 1,
  expiration: Date | string | null = null,
  batch: string = '',
): StockFormModel {
  return {quantity: qty, expirationDate: expiration, batchNumber: batch};
}

/**
 * Kreira jednu komponentu paketa (Bundle)
 */
export function createComponent(
  id: number | null = null,
  qty: number = 1,
  name: string = '',
  availableStock: number | null = null,
): ComponentFormModel {
  return {componentId: id, quantity: qty, name, availableStock};
}

export function emptyArticleModel(): ArticleFormModel {
  return {
    name: '',
    barcodes: [],
    price: 0,
    admissionPrice1: 0,
    admissionPrice2: 0,
    active: true,
    category: '',
    isBundle: false,
    initialStocks: [],
    components: [],
    image: null,
  };
}

/**
 * Pravi početni model forme pri otvaranju (Create ili Edit)
 */
export function createArticleModel(
  article: SalesArticleWithExtra | null,
  image: File | null,
): ArticleFormModel {
  const model = emptyArticleModel();

  // Ako menjamo POSTOJEĆI artikal
  if (article?.id && !ObjectUtils.isEmptyObject(article)) {
    const composition = article.composition ?? [];
    Object.assign(model, {
      name: article.name,
      price: article.price,
      active: article.active,
      admissionPrice1: article.admissionPrice1,
      admissionPrice2: article.admissionPrice2,
      category: article.category ?? '',
      image,
      barcodes: [...(article.barcodes ?? [])],
      isBundle: composition.length > 0,
      components: composition.map(c => createComponent(c.articleId, c.quantity, c.name, c.availableStock)),
      initialStocks: (article.stocks ?? []).map(s =>
        createStock(s.quantity, s.expirationDate, s.batchNumber || ''),
      ),
    } satisfies Partial<ArticleFormModel>);
  }

  // Skenirana zaliha (sa barkod čitača) ide kao nova serija
  const scanned = isStockAvailable(article);
  if (scanned) {
    model.initialStocks = [...model.initialStocks, createStock(scanned.quantity, scanned.expiryDate)];
  }

  return model;
}

interface ArticleSchemaDeps {
  article: SalesArticleWithExtra | null;
  articleApi: ArticlesApiService;
  initialImage: Signal<File | null>;
}

/**
 * Definiše validaciju i logiku forme
 */
export function articleFormSchema({article, articleApi, initialImage}: ArticleSchemaDeps) {
  const editingId = article?.id;

  return schema<ArticleFormModel>((p) => {
    required(p.name, {message: 'Ime je obavezno'});
    validateAsync(p.name, {
      // Proveravamo samo ako je korisnik menjao ime
      when: ({state}) => state.dirty(),
      params: ({value}) => value(),
      debounce: 500,
      factory: (name) =>
        rxResource({
          params: name,
          stream: ({params}) =>
            editingId
              ? articleApi.checkArticleNameButExcludeCurrent(params, editingId)
              : articleApi.checkArticleName(params),
        }),
      onSuccess: (available) => (available ? null : {kind: 'nameTaken', message: 'Ime je zauzeto'}),
      onError: () => null,
    });

    for (const price of [p.price, p.admissionPrice1, p.admissionPrice2]) {
      required(price);
      min(price, 0);
    }

    validate(p.barcodes, ({value}) =>
      hasDuplicateValues(value()) ? {kind: 'duplicateValue'} : null,
    );
    applyEach(p.barcodes, (barcode) => {
      required(barcode);
      validate(barcode, ({value}) => {
        const kind = eanError(value());
        return kind ? {kind} : null;
      });
    });

    validate(p.image, ({value}) => (isImageTooLarge(value()) ? {kind: 'maxFileSize'} : null));

    // Zalihe se validiraju samo za običan artikal
    applyWhen(p.initialStocks, ({valueOf}) => !valueOf(p.isBundle), (stocks) => {
      applyEach(stocks, (stock) => {
        required(stock.quantity);
        min(stock.quantity, 1);
        required(stock.expirationDate);
      });
    });

    // Komponente se validiraju samo za bundle
    applyWhen(p.components, ({valueOf}) => valueOf(p.isBundle), (components) => {
      applyEach(components, (component) => {
        required(component.componentId);
        required(component.quantity);
        min(component.quantity, 1);
        // Količina ne može biti veća od dostupne u magacinu (zaliha stiže sa servera uz izabranu komponentu)
        max(component.quantity, ({valueOf}) => valueOf(component.availableStock) ?? undefined);
      });
    });

    // Detekcija promena (edit mod) - da li je bilo šta pipnuto
    if (editingId) {
      validate(p, ({value}) =>
        hasArticleChanges(article, value(), initialImage()) ? null : {kind: 'noChanges'},
      );
    }
  });
}
