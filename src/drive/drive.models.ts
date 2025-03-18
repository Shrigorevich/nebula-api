export interface DriveFileMeta {
  name: string;
  downloadLink: string;
  size: string;
}

export interface UploadingStatus {
  completed: boolean;
  uploadedSize?: number;
  fileId?: string;
}
