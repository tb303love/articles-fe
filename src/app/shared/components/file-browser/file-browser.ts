import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileActionHandler, FileBrowserData } from '../../../core/model';
import { FileEntry, FileSystemService } from '../../../core/services/file-system-service';

@Component({
  selector: 'app-file-browser',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './file-browser.html',
  styleUrl: './file-browser.scss',
})
export class FileBrowser {
  protected readonly fs = inject(FileSystemService);
  private readonly dialogRef = inject(MatDialogRef<FileBrowser>);

  protected isProcessing = signal(false);
  protected readonly data = inject<FileBrowserData>(MAT_DIALOG_DATA);

  async onFileClick(item: FileEntry) {
    if (this.isProcessing()) return; // Sprečava dupli klik

    if (item.kind === 'directory') {
      await this.fs.navigateToDirectory(item.handle);
      return;
    }

    const handler = this.getHandler(item.name);
    if (!handler) return;

    const file = await this.fs.readFile(item.handle);

    this.isProcessing.set(true); // Aktivira blokadu i loader

    handler.run(file).subscribe({
      next: (shouldClose) => {
        this.isProcessing.set(false); // Oslobađa UI
        if (shouldClose) {
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        this.isProcessing.set(false); // Oslobađa UI u slučaju greške
        console.error('File Action Error:', err);
      },
    });
  }

  protected getHandler(fileName: string): FileActionHandler | undefined {
    const ext = '.' + fileName.split('.').pop()?.toLowerCase();
    return this.data.handlers.find((h) => h.extensions.includes(ext));
  }
}
