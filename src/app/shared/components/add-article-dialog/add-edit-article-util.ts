import {ObjectUtils} from '../../../core/utils/util';
import {SalesArticleWithExtra} from '../../../core/model';
import {BarCodeScan} from '../../../core/model/barcode.model';

export const isStockAvailable = (sales: SalesArticleWithExtra | null): BarCodeScan | null =>
  sales?.stock && !ObjectUtils.isEmptyObject((sales?.stock)) ? sales.stock : null;
