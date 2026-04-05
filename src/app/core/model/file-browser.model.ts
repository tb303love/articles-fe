import { Observable } from "rxjs";

export interface FileActionHandler {
  extensions: string[];
  label: string;
  icon: string;
  color: string;
  run: (file: File) => Observable<boolean>;
}

export interface FileBrowserData {
  title: string;
  subtitle: string;
  handlers: FileActionHandler[];
}