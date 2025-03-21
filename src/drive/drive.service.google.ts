import { Injectable, OnModuleInit } from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import * as path from 'path';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { Readable } from 'stream';
import { DriveFileMeta, UploadingStatus } from './drive.models';
import { GoogleAuth } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import axios, { AxiosResponse } from 'axios';
import { DriveFileDto } from './drive.dto';

@Injectable()
export class DriveServiceGoogle implements OnModuleInit {
  private readonly driveClient: drive_v3.Drive;
  private accessToken: string;

  constructor(private readonly configProvider: ConfigProvider) {
    this.driveClient = this.createDriveClient();
  }

  /**
   * Gets the list of files stored on Google Drive
   * @returns
   */
  async getFiles(): Promise<DriveFileDto[]> {
    const response = await this.driveClient.files.list({});
    return response.data.files
      ? response.data.files.map((f) => ({
          kind: f.kind,
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
        }))
      : [];
  }

  /**
   * Uploads specified file stream to Drive
   * @param stream
   * @param fileName
   * @param mimeType
   * @returns Uploaded file's meta data
   */
  async streamToDrive(
    stream: Readable,
    fileName: string,
    mimeType: string,
  ): Promise<DriveFileMeta> {
    const response = await this.driveClient.files.create({
      requestBody: {
        name: fileName,
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: 'id, name, webContentLink, size, createdTime',
    });
    this.makeFilePublic(response.data.id!);
    return this.getFileMeta(response.data);
  }

  /**
   * Gets file download link by specified file ID
   * @param id File identifier
   * @returns
   */
  async getDownloadLink(id: string): Promise<string> {
    const response = await this.driveClient.files.get({
      fields: 'webContentLink',
      fileId: id,
    });
    return response.data.webContentLink!;
  }

  /**
   * Gets the file's uploading status
   * @param uploadUrl Resumable uploading url
   * @returns Uploading status
   */
  async getUploadingStatus(uploadUrl: string): Promise<UploadingStatus> {
    const response = await axios.put(uploadUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Range': `*/*`,
      },
      validateStatus: (status: number) => {
        return status >= 200 && status < 405;
      },
    });
    console.log('status: ' + response.status);
    return this.populateStatus(response);
  }

  /**
   * Uploads specified file chunk to Drive
   * @param uploadUrl
   * @param chunk
   * @param startByte
   * @param endByte
   * @param fileSize
   * @returns
   */
  async uploadChunk(
    uploadUrl: string,
    chunk: Readable,
    startByte: number,
    endByte: number,
    fileSize: number,
  ): Promise<UploadingStatus> {
    const response = await axios.put(`${uploadUrl}`, chunk, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Length': (endByte - startByte + 1).toString(),
        'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
      },
      validateStatus: (status) => {
        return status >= 200 && status < 405;
      },
    });

    console.log('Chunk uploaded: ', response.status);
    return this.populateStatus(response);
  }

  /**
   * Creates resumable upload url
   * @param fileName
   * @param mimeType
   * @returns url
   */
  async createResumableUploadUrl(
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const resp = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        body: JSON.stringify({
          name: fileName,
          mimeType: mimeType,
        }),
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'content-type': 'application/json; charset=UTF-8',
        },
      },
    );
    if (!resp.headers.has('location'))
      throw new Error('Can not get upload url');

    return resp.headers.get('location')!;
  }

  /**
   * Makes specified file public
   * @param fileId File identifier
   */
  async makeFilePublic(fileId: string) {
    await this.driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        type: 'anyone',
        role: 'reader',
      },
    });
  }

  /**
   * Deletes all files on the Drive
   */
  async clearDrive(): Promise<void> {
    const list = await this.driveClient.files.list();
    list.data.files?.forEach(async (file) => {
      await this.driveClient.files.delete({
        fileId: file.id!,
      });
    });
  }

  private populateStatus(response: AxiosResponse) {
    const result: UploadingStatus = {
      completed: false,
    };
    if (response.status === 200 || response.status === 201) {
      result.completed = true;
      result.fileId = response.data.id;
      return result;
    }
    if (response.status === 308) {
      result.uploadedSize = Number(response.headers['range'].split('-')[1]);
    }
    return result;
  }

  private getFileMeta(data: drive_v3.Schema$File): DriveFileMeta {
    return {
      name: data.name as string,
      downloadLink: data.webContentLink as string,
      size: Number(data.size),
    };
  }

  private createDriveClient(): drive_v3.Drive {
    return google.drive({ version: 'v3', auth: this.getGoogleAuth() });
  }

  private getGoogleAuth(): GoogleAuth<JSONClient> {
    const credPath = path.join(
      process.cwd(),
      this.configProvider.googleCredFile(),
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: credPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return auth;
  }

  private async getAuthToken(): Promise<string> {
    const auth = this.getGoogleAuth();
    const client = await auth.getClient();
    return (await client.getAccessToken()).token!;
  }

  async onModuleInit() {
    this.accessToken = await this.getAuthToken();
  }
}
