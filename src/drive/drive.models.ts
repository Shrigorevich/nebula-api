export interface DriveFileMeta {
  name: string;
  downloadLink: string;
  size: number;
}

export interface UploadingStatus {
  completed: boolean;
  uploadedSize?: number;
  fileId?: string;
}
