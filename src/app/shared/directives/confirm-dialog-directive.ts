import {
    Directive,
    EventEmitter,
    HostListener,
    inject,
    input,
    Output,
    signal,
    Signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, take } from 'rxjs';
import { AuthService } from '../../core/services/auth-service';
import { ConfirmDialog } from '../components/confirm-dialog/confirm-dialog';

@Directive({
  selector: '[appConfirmDialog]',
})
export class ConfirmDirective {
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly panelClass = this.authService.isAdmin() ? ['admin-theme'] : ['user-theme'];
  // change it to signal input
  appConfirmDialog = input<{ title: string; message: string; positiveButtonLabel: string }>({
    title: 'Da li ste sigurni?',
    message: 'Da li ste sigurni?',
    positiveButtonLabel: 'Obriši',
  });
  isLoading = input<Signal<boolean>>(signal(false)); // Default ugašen signal
  onSuccess$ = input<Observable<void>>(); // Observable koji čekamo za zatvaranje

  @Output() confirmAction = new EventEmitter<void>();

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    // Sprečava druge akcije dok se ne potvrdi
    event.preventDefault();
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '300px',
      panelClass: this.panelClass,
      disableClose: true,
      data: {
        ...this.appConfirmDialog(),
        isLoading: this.isLoading(),
        confirm: () => {
          this.confirmAction.emit();
        },
      },
    });

    // 2. ČEKAMO STORE: Tek kada stigne uspeh, zatvaramo dijalog
    this.onSuccess$()
      ?.pipe(take(1))
      .subscribe(() => {
        dialogRef.close();
      });
  }
}
