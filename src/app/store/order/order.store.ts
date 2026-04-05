import { signalStore, withState } from '@ngrx/signals';
import { withOrderMethods } from './order.methods';
import { withOrderSelectors } from './order.selectors';
import { initialState } from './order.state';

export const OrderStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withOrderSelectors(),
  withOrderMethods()
);
