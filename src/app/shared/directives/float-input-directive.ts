import { Directive, forwardRef, ElementRef, Renderer2, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Directive({
  selector: 'input[appFloatInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FloatInputDirective),
      multi: true,
    },
  ],
})
export class FloatInputDirective implements ControlValueAccessor {
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  // Writes a new value from the form model to the DOM element
  writeValue(value: any): void {
    const floatValue = parseFloat(value);
    const formattedValue = formattedString(floatValue); // Format to 2 decimal places
    this.renderer.setProperty(this.el.nativeElement, 'value', formattedValue);
  }

  // Registers a callback function that is called when the control's value changes in the UI
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // Registers a callback function that is called when the control is touched (loses focus)
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Optional: Allows the forms API to disable the input
  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  // Listen for input events on the host element to update the form model
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const floatValue = parseFloat(value);
    if (value === '' || isNaN(floatValue)) {
      const formattedValue = formattedString(floatValue); // Format to 2 decimal places
      this.renderer.setProperty(this.el.nativeElement, 'value', formattedValue);
      this.onChange(null);
      return;
    }
    // Sanitize the input to allow only numbers and a single decimal point
    const sanitized = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

    // Update the native element's value to the sanitized version
    this.renderer.setProperty(this.el.nativeElement, 'value', sanitized);
    const toFixedValue = parseFloat(sanitized).toFixed(2);
    // Notify Angular forms of the change
    this.onChange(parseFloat(toFixedValue));
  }

  // Listen for blur events to mark the control as touched
  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
    // Optional: Re-format value on blur for presentation
    this.writeValue(this.el.nativeElement.value);
  }
}

function formattedString(floatValue: number): string {
  return isNaN(floatValue) ? '' : floatValue.toFixed(2);
}
