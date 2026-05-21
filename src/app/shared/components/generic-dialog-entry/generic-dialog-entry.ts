import {Component, DestroyRef, inject, OnInit, Type} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {mergeMap} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  template: ''
})
export class GenericDialogEntryComponent implements OnInit {
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private state = {};

  constructor() {
    // Uzimanje state objekta koji je poslat kroz routerLink
    const currentNav = this.router.currentNavigation();
    const routerState = currentNav?.extras?.state || {};

    if (routerState) {
      this.state = {...routerState['article'], stock: {...routerState['stock']}};
    }
  }

  ngOnInit(): void {
    const componentToOpen = this.route.snapshot.data['modalComponent'] as Type<any>;

    // 2. Skupljamo sve parametre iz URL-a (npr. :id, :type) i query parametre
    const params = this.route.snapshot.params;
    const queryParams = this.route.snapshot.queryParams;

    // 3. Otvaramo modal i prosleđujemo sakupljene podatke
    const dialogRef = this.dialog.open(componentToOpen, {
      width: '720px', // Savršena širina za ovaj layout
      maxWidth: '95vw',
      autoFocus: false,
      data: {...params, ...queryParams, ...{...this.state}} // Sve šaljemo unutar jednog objekta
    });

    // 4. Nakon zatvaranja modala vraćamo se nazad
    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef),
      mergeMap(() => this.goBack())
    ).subscribe();
  }

  private goBack(): Promise<boolean> {
    return this.router.navigate(['../'], {relativeTo: this.route});
  }
}
