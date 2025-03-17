export interface FileSyncTask {
  id: string;
  status: number;
  hash: string;
}

export interface TaskFile {
  taskId: string;
  index: number;
}

export interface DownloadTaskFile extends TaskFile {
  dir: string;
  url: string;
}

export interface UploadTaskFile extends TaskFile {
  path: string;
}

export enum FileEventType {
  Downloaded = 'downloaded',
  Uploaded = 'uploaded',
}

export enum TaskQueue {
  EventQueue = 'event-queue',
  Downloading = 'downloading-queue',
  Uploading = 'uploading-queue',
}

export interface FileEvent {
  taskId: string;
  index: number;
  type: FileEventType;
  result: boolean;
  data: string;
}
