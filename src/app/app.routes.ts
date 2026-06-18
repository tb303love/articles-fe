import {Routes} from '@angular/router';
import {adminGuard, authGuard} from './core/guards';
import {Login} from './login/login';
import {NotFound} from './not-found/not-found';

const appRoutes: Routes = [
   // Javno dostupna ruta za prijavu
   {path: 'login', component: Login},

   // Početna ruta koja preusmerava na artikle
   {path: '', redirectTo: '/artikli', pathMatch: 'full'},

   // ARTIKLI: Zaštićeni i ulogom i loginom (Lazy Loaded)
   {
      path: 'artikli',
      canActivate: [authGuard, adminGuard], // SAMO ADMIN
      loadChildren: () => import('./article-list/article.routes'),
   },

   // PRODAJA: Zaštićena samo loginom (Lazy Loaded)
   {
      path: 'prodaja',
      canActivate: [authGuard], // SVI ULOGOVANI
      loadChildren: () => import('./sales/sales.routes'),
   },

   // Catch-all ruta za nepostojeće stranice
   {path: '**', component: NotFound},
];

export default appRoutes;
