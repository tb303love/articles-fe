import {Routes} from '@angular/router';
import {AddArticleDialog, GenericDialogEntryComponent} from '../shared/components';
import {modalComponentGuard} from '../shared/components/generic-dialog-entry/modalComponentGuard';

const articleRoutes: Routes = [
  {
    path: '', // Prazna putanja predstavlja roditelja (/dashboard)
    loadComponent: () => import('./article-list').then(m => m.ArticleList),
    children: [
      {
        path: 'new', // Dostupno na: /dashboard/profile
        component: GenericDialogEntryComponent,
        canActivate: [modalComponentGuard],
        data: {
          modalComponent: AddArticleDialog,
        }
      },
      {
        path: ':id',
        component: GenericDialogEntryComponent,
        canActivate: [modalComponentGuard],
        data: {
          modalComponent: AddArticleDialog
        }
      }
    ]
  }
];
 export default articleRoutes;