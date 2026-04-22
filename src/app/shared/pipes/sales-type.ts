import {Pipe, PipeTransform} from '@angular/core';
import {SalesOrderType} from '../../store/order/order.state';

@Pipe({
  name: 'salesType'
})
export class SalesTypePipe implements PipeTransform {

  transform(salesType: SalesOrderType): string {
    switch (salesType) {
      case "ACTIVE":
        return 'aktivnih';
      case "REFUNDED":
        return 'refundiranih';
      case 'RETAIL':
        return 'oporezovanih';
      case "WHOLESALE": return 'neoporezovanih';
      default:
        return 'svih';
    }
  }

}
