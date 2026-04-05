import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { map, pipe, switchMap, tap } from 'rxjs';
import { CategoryApiService } from '../core/services/category-api-service'; // Tvoj API servis

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState({
    categoryNames: [] as string[],
    isLoading: false,
  }),
  withComputed((state) => ({
    // Automatsko sortiranje imena po abecedi za UI
    sortedNames: computed(() => [...state.categoryNames()].sort((a, b) => a.localeCompare(b))),
  })),
  withMethods((store, categoryService = inject(CategoryApiService)) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() =>
          categoryService.getCategoryNames().pipe(
            map((categoryNames) => categoryNames.map((c) => c.name)),
            tap((categoryNames) => patchState(store, { categoryNames, isLoading: false })),
          ),
        ),
      ),
    ),
  })),
);
