import { Component, ElementRef, EventEmitter, inject, input, linkedSignal, OnDestroy, Output, viewChild } from '@angular/core';
import { Subject, timer, Subscription } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-number-spinner',
  standalone: true,
  templateUrl: './number-spinner.html',
  styleUrl: './number-spinner.scss',
})
export class NumberSpinner implements OnDestroy {
  // Inputi koriste novu Signal sintaksu
  readonly inputValue = input.required<number>();
  readonly max = input.required<number>();
  readonly articleId = input.required<number>();
  
  // Lokalno stanje sinhronizovano sa inputom
  protected readonly value = linkedSignal(() => this.inputValue());
  
  // Referenca na input iz template-a (#inputField)
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputField');
  
  @Output() readonly valueChanged = new EventEmitter<number>();

  // RxJS za Long-press funkcionalnost
  private readonly startChange$ = new Subject<number>();
  private readonly stopChange$ = new Subject<void>();
  private readonly subscription: Subscription;
  private el = inject(ElementRef);

  constructor() {
    this.subscription = this.startChange$.pipe(
      switchMap(direction => 
        timer(400, 80).pipe( // Čeka 400ms, pa menja na svakih 80ms
          takeUntil(this.stopChange$),
          tap(() => this.updateValue(this.value() + direction))
        )
      )
    ).subscribe();
  }
  
  public focusInput() {
    // Signal viewChild() se poziva kao funkcija
    const el = this.inputEl();
    if (el) {
      el.nativeElement.focus();
      el.nativeElement.select(); // Odmah selektuj broj
    }
  }
  
  public hasFocus(): boolean {
    // Proverava da li je aktivni element (input) unutar ove komponente
    return this.el.nativeElement.contains(document.activeElement);
  }

  protected updateValue(newValue: number) {
    // Bankarska validacija: uvek ceo broj, min 1, max limit
    const clamped = Math.max(1, Math.min(Math.floor(newValue), this.max()));
    
    if (clamped !== this.value()) {
      this.value.set(clamped);
      this.valueChanged.emit(clamped);
    }
  }

  // Hendleri za dugmiće (Miš + Touch)
  protected onStart(direction: number) {
    this.updateValue(this.value() + direction);
    this.startChange$.next(direction);
  }

  protected onStop() {
    this.stopChange$.next();
  }

  // Tvoja Keyboard logika prebačena u čistiji format
  protected onKeydown(event: KeyboardEvent) {
    const { key } = event;

    // Brze akcije strelicama
    if (key === 'ArrowUp') {
      event.preventDefault();
      this.updateValue(this.value() + 1);
      return;
    }
    if (key === 'ArrowDown') {
      event.preventDefault();
      this.updateValue(this.value() - 1);
      return;
    }

    // Dozvoli standardne navigacione tastere
    const navKeys = ['Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight'];
    if (navKeys.includes(key)) return;

    event.preventDefault();

    // Brisanje cifre (bankarska logika: minimum je 1)
    if (key === 'Backspace' || key === 'Delete') {
      const s = this.value().toString();
      this.updateValue(s.length > 1 ? parseInt(s.slice(0, -1), 10) : 1);
      return;
    }

    // Unos novih cifara
    if (/^[0-9]$/.test(key)) {
      const nextValue = parseInt(this.value().toString() + key, 10);
      this.updateValue(nextValue);
    }
  }
  
  protected onPaste(event: ClipboardEvent) {
    // Sprečava browser da zapravo upiše tekst u polje
    event.preventDefault(); 
  
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedText = clipboardData.getData('text');
  
    // Čistimo sve što nisu brojevi (uklanja razmake, tačke, valute)
    const cleanNumber = pastedText.replace(/\D/g, '');
  
    if (cleanNumber) {
      const newValue = parseInt(cleanNumber, 10);
      // updateValue već ima logiku za Math.min(newValue, max())
      this.updateValue(newValue);
    }
  }
  
  protected onSelect(event: Event) {
    // Sprečava korisnika da selektuje tekst unutar inputa mišem
    (event.target as HTMLInputElement).selectionStart = (event.target as HTMLInputElement).selectionEnd;
  }
  
  protected onFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select(); // Selektuje ceo tekst za brzu izmenu
  }
  
  // U TS fajlu
  protected getDynamicWidth() {
    const charCount = this.value().toString().length;
    // Svaka cifra je otprilike 1ch širine + padding
    return `${charCount + 2}ch`; 
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
