import {Routes} from '@angular/router';

const salesRoutes: Routes = [
   {
      path: '',
      loadComponent: () => import('./sales').then(m => m.Sales),
   }
];

export default salesRoutes;