import { Injectable, signal, WritableSignal } from '@angular/core';
import { inject } from '@angular/core/primitives/di';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BehaviorSubject, Observable } from 'rxjs';
import { SalesArticle } from '../model';

interface ImageLoadingDto {
  state: 'init' | 'loading' | 'loaded';
  image: File | null;
  event: 'load' | 'read' | null;
}

@Injectable({
  providedIn: 'root',
})
export class FileReaderService {
  readonly imagePreview: WritableSignal<SafeResourceUrl | null> = signal<SafeResourceUrl | null>(
    null,
  );
  private readonly sanitizer = inject(DomSanitizer);
  private fileReaderWorker: Worker | undefined;
  private imagePreviewSubject = new BehaviorSubject<ImageLoadingDto>({
    state: 'init',
    image: null,
    event: null,
  });

  terminateWorker() {
    this.imagePreview.set(null);
    this.imagePreviewSubject.next({ state: 'init', image: null, event: null });
    this.fileReaderWorker?.terminate();
  }

  getFile(): Observable<ImageLoadingDto> {
    return this.imagePreviewSubject.asObservable();
  }

  initializeWorker() {
    if (typeof Worker !== 'undefined') {
      // Create a new worker instance using a URL relative to import.meta.url
      this.fileReaderWorker = new Worker(new URL('./file-loader.worker', import.meta.url), {
        type: 'module',
      });

      // Listen for messages from the worker thread
      this.fileReaderWorker.onmessage = ({ data }) => {
        if (data.event === 'load') {
          this.imagePreviewSubject.next({ state: 'loaded', image: data.file, event: 'load' });
        } else {
          this.imagePreviewSubject.next({ state: 'loaded', image: data.file, event: 'read' });
        }

        if (data.url) {
          this.imagePreview.update(() => this.sanitizer.bypassSecurityTrustUrl(data.url as string));
        }
      };

      // Handle potential errors from the worker
      this.fileReaderWorker.onerror = (error) => {
        // this.messageSubject.error(error);
      };
    } else {
      console.error('Web workers are not supported in this environment.');
      // Provide a fallback mechanism if workers are not supported
    }
  }

  removeImage() {
    this.imagePreview.set(null);
  }

  loadImage(data: SalesArticle | null) {
    //article.image.fileName, article.image.fileType
    if (!data || !data.image) {
      this.fileReaderWorker?.postMessage({
        event: 'load',
        fileName: null,
      });
    } else {
      this.fileReaderWorker?.postMessage({
        fileName: data.image.fileName,
        type: data.image.fileType,
        event: 'load',
        url: `images/${data.image.fileName}`,
      });
    }
  }

  readImage(file: File) {
    this.fileReaderWorker?.postMessage({ file, event: 'read' });
  }
}
