import { Directive, forwardRef, ElementRef, HostListener } from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";

@Directive({
  selector: 'input[appNumericInput]', // Apply to inputs with this attribute
  standalone: true, // Mark as standalone
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumericInputDirective),
      multi: true // Allows multiple CVAs on one element, Angular chooses the best match
    }
  ]
})
export class NumericInputDirective implements ControlValueAccessor {
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLInputElement>) {}

  // Called by the forms API to write a value from the form model to the view
  writeValue(value: number | null): void {
    this.el.nativeElement.value = (value === null) ? '' : String(value);
  }

  // Registers a callback function that is called when the control's value changes in the UI
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  // Registers a callback function that is called when the control receives a touch event
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  // Optional: allows the form API to disable the input
  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  // Listen for input events to sanitize the value and update the form model
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    // Sanitize the input to allow only numbers (and maybe a decimal point)
    const sanitized = (event.target as HTMLInputElement).value.replace(/[^0-9.]/g, ''); 
    
    // Update the native element's value to reflect the sanitized input immediately
    this.el.nativeElement.value = sanitized;

    // Convert the sanitized string to a number and pass it to the form model
    const numericValue = sanitized === '' ? null : parseFloat(sanitized);

    // Call the registered onChange function to update the Angular form model
    this.onChange(numericValue);
  }
  
  @HostListener('blur')
  onBlur(): void {
    // Call the registered onTouched function when the input is blurred
    this.onTouched();
  }
}