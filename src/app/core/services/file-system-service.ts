import { Injectable, signal, computed } from '@angular/core';
import { get, set } from 'idb-keyval';

export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  handle: any;
}

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  // Osnovni signali za UI
  currentFiles = signal<FileEntry[]>([]);
  currentPath = signal<string>('Nije povezano');
  isLoading = signal(false);

  // KLJUČNA IZMENA: Stack je sada Signal. Ovo garantuje da breadcrumbs uvek vide promenu.
  private directoryStack = signal<any[]>([]);

  // Breadcrumbs automatski prate promene u stack-u
  breadcrumbs = computed(() => this.directoryStack().map(h => h.name));
  
  // Provera za Back dugme
  canGoBack = computed(() => this.directoryStack().length > 1);

  constructor() {
    this.tryRestoreFolder();
  }

  private async tryRestoreFolder() {
    try {
      const savedHandle = await get('pos-repo-handle');
      if (savedHandle) {
        // Inicijalizujemo stack sa zapamćenim root-om
        this.directoryStack.set([savedHandle]);
        this.currentPath.set(`Zapamćeno: ${savedHandle.name}`);
        // Ne pozivamo refreshFiles automatski jer browser traži interakciju za dozvolu
      }
    } catch (err) {
      console.warn('Greška pri čitanju memorije:', err);
    }
  }

  /**
   * Prvo povezivanje (Root folder)
   */
  async openDirectory() {
    try {
      this.isLoading.set(true);
      const handle = await (window as any).showDirectoryPicker();
      
      await set('pos-repo-handle', handle);
      
      // Postavljamo novi niz sa jednim elementom
      this.directoryStack.set([handle]);
      
      await this.refreshFiles();
    } catch (err) {
      console.error('Korisnik otkazao:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Ulazak u podfolder (Navigacija naniže)
   */
  async navigateToDirectory(handle: any) {
    // update kreira NOVI niz (spread operator), što budi breadcrumbs computed signal
    this.directoryStack.update(stack => [...stack, handle]);
    await this.refreshFiles();
  }

  /**
   * Povratak unazad (Navigacija naviše)
   */
  async goBack() {
    if (this.canGoBack()) {
      this.directoryStack.update(stack => stack.slice(0, -1));
      await this.refreshFiles();
    }
  }

  /**
   * Skok na specifičan nivo iz Breadcrumbs trake
   */
  async navigateToLevel(index: number) {
    const currentStack = this.directoryStack();
    if (index >= currentStack.length - 1) return;
    
    this.directoryStack.set(currentStack.slice(0, index + 1));
    await this.refreshFiles();
  }

  /**
   * Čita sadržaj foldera koji je TRENUTNO poslednji u stack-u
   */
   async refreshFiles() {
     const stack = this.directoryStack();
     if (stack.length === 0) return;
   
     const activeHandle = stack[stack.length - 1];
   
     try {
       this.isLoading.set(true);
       
       // Provera dozvola...
       if ((await activeHandle.queryPermission({mode: 'read'})) !== 'granted') {
         if ((await activeHandle.requestPermission({mode: 'read'})) !== 'granted') return;
       }
   
       const entries: FileEntry[] = [];
       for await (const entry of activeHandle.values()) {
         // PROMENA: Izbacujemo specifičnu isExcel proveru. 
         // Puštamo SVE foldere i SVE fajlove, a FileBrowser će u HTML-u 
         // pomoću getHandler(name) da odluči šta je "disabled".
         entries.push({
           name: entry.name,
           kind: entry.kind,
           handle: entry,
         });
       }
   
       this.currentFiles.set(
         entries.sort((a, b) => {
           if (a.kind === b.kind) return a.name.localeCompare(b.name);
           return a.kind === 'directory' ? -1 : 1;
         })
       );
   
       this.currentPath.set(activeHandle.name);
     } finally {
       this.isLoading.set(false);
     }
   }


  async readFile(fileHandle: any): Promise<File> {
    return await fileHandle.getFile();
  }

  async forgetFolder() {
    await set('pos-repo-handle', null);
    this.directoryStack.set([]);
    this.currentFiles.set([]);
    this.currentPath.set('Nije povezano');
  }
}
