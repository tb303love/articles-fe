// src/app/services/web-socket.service.ts
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, timer } from 'rxjs';
import { map, retry, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type WsTopic = 'sales' | 'inventory' | 'new-article' | 'info'| 'connection-mode' | 'adb-progress';

export interface RustWsPoruka {
   tip: WsTopic;
   podaci: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
   private socket$!: WebSocketSubject<any>;
   private poruke$ = new Subject<RustWsPoruka>();

   constructor() {
      this.inicijalizujCistWs();
   }

   private inicijalizujCistWs() {
      const wsUrl = environment.websocketConfig?.brokerURL;

      this.socket$ = webSocket({
         url: wsUrl,
         // Pošto Angular samo prima, serializer nam tehnički i ne treba, ali ostaje kao default
         deserializer: (msg) => JSON.parse(msg.data)
      });

      this.socket$.pipe(
         retry({
            delay: (error) => {
               console.warn('WS: Veza prekinuta. Pokušavam rekonekciju za 3s...', error);
               return timer(3000);
            }
         })
      ).subscribe({
         next: (poruka: RustWsPoruka) => this.poruke$.next(poruka),
         error: (err) => console.error('WS Kritična greška:', err),
         complete: () => console.log('WS veza zatvorena.')
      });
   }

   /**
    * Slušanje poruka prema "tipu" (sales, inventory, new-article, info)
    */
   watchTopic<T>(topic: WsTopic): Observable<T> {
      return this.poruke$.asObservable().pipe(
         filter(poruka => poruka.tip === topic),
         map(poruka => poruka.podaci as T)
      );
   }
}
