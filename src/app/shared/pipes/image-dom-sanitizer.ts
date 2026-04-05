import { Pipe } from '@angular/core';
import { ArticleImage } from '../../core/model';

@Pipe({
  name: 'imageDomSanitizer',
})
export class ImageDomSanitizerPipe {
  transform(image: ArticleImage): string {
    return `/images/${image?.fileName}`;
  }
}
