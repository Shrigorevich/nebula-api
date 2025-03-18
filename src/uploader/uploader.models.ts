export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'inProgress',
  Done = 'done',
  Error = 'error',
}

export enum JobQueue {
  InitUploading = 'init-uploading',
  ResumableUploading = 'resumable-uploading',
  NonResumableUploading = 'non-resumable-uploading',
}

export enum JobType {
  UploadInitTask = 'upload-init-job',
  ResumableUploadTask = 'resumable-upload-job',
  NonResumableUploadTask = 'non-resumable-upload-job',
}

export interface UploadJob {
  taskId: string;
  url: string;
  index: number;
}

export interface FileMeta {
  name: string;
  mime: string;
}

export interface ResumableFileMeta extends FileMeta {
  size: number;
}

export interface ResumableUploadJob extends UploadJob {
  file: ResumableFileMeta;
}

export interface NonResumableUploadJob extends UploadJob {
  file: FileMeta;
}
