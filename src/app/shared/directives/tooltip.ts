import { Overlay, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

@Directive({
  selector: '[appHoverOverlay]',
  standalone: true,
})
export class HoverOverlayDirective implements OnDestroy {
  // Template koji se prikazuje
  @Input('appHoverOverlay') contentTemplate!: TemplateRef<any>;
  
  // Podaci o artiklu (row) koje prosleđujemo u template
  @Input('appHoverOverlayData') rowData: any; 

  private readonly viewContainerRef = inject(ViewContainerRef);
  private overlayRef!: OverlayRef;
  private isOverlayOpen = false;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
  ) {}

  ngOnDestroy() {
    this.closeOverlay();
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.openOverlay();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.closeOverlay();
  }

  private openOverlay() {
    if (this.isOverlayOpen || !this.contentTemplate) return;

    const positionStrategy = this.getPositionStrategy();
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false
    });

    // Kreiramo portal i ubrizgavamo podatke kroz context ($implicit)
    const portal = new TemplatePortal(this.contentTemplate, this.viewContainerRef, {
      $implicit: this.rowData
    });

    this.overlayRef.attach(portal);
    this.isOverlayOpen = true;
  }

  private closeOverlay() {
    if (this.overlayRef && this.isOverlayOpen) {
      this.overlayRef.dispose(); // Potpuno uništava overlay i čisti DOM
      this.isOverlayOpen = false;
    }
  }

  private getPositionStrategy(): PositionStrategy {
    // Postavlja tooltip na centar ekrana (idealno za POS tablet)
    return this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();
  }
}
