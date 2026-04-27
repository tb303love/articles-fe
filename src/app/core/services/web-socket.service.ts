import {Injectable} from '@angular/core';
import {RxStomp} from '@stomp/rx-stomp';
import {map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class WebSocketService {
  private rxStomp = new RxStomp();

  constructor() {
    this.rxStomp.configure({
      brokerURL: environment.webSocketUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    this.rxStomp.activate();
  }

  watchTopic(topic: string) {
    return this.rxStomp.watch(topic).pipe(
      map(message => {
        try {
          // Pokušaj da parsiraš kao JSON (za inventory/StockEntry)
          return JSON.parse(message.body);
        } catch (e) {
          // Ako ne uspe, vrati sirov tekst (za tvoj sales barkod)
          return message.body;
        }
      }),
    );
  }
}
