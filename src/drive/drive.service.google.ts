import { Injectable, OnModuleInit } from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { Readable } from 'stream';
import { DriveFileMeta, UploadingStatus } from './drive.models';
import { GoogleAuth } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class DriveServiceGoogle implements OnModuleInit {
  private readonly driveClient: drive_v3.Drive;
  private accessToken: string;

  constructor(private readonly configProvider: ConfigProvider) {
    this.driveClient = this.createDriveClient();
  }

  async getFiles(): Promise<any> {
    const response = await this.driveClient.files.list({});
    console.log(response.data);
    return response.data;
  }

  async getDownloadLink(id: string): Promise<string> {
    const response = await this.driveClient.files.get({
      fields: 'webContentLink',
      fileId: id,
    });
    return response.data.webContentLink!;
  }

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
    console.log(response.data);
    this.makeFilePublic(response.data.id as string);

    return this.getFileMeta(response.data);
  }

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
    console.log(response);
    return this.populateStatus(response);
  }

  async uploadChunk(
    uploadUrl: string,
    chunk: Readable,
    startByte: number,
    endByte: number,
    fileSize: number,
  ): Promise<UploadingStatus> {
    const response = await axios.put(uploadUrl, chunk, {
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

  async getResumableUploadUrl(
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

  private populateStatus(response: AxiosResponse) {
    const result: UploadingStatus = {
      completed: false,
    };
    if (response.status === 200 || response.status === 201) {
      result.completed = true;
      console.log(response.data);
      result.downloadLink = response.data.webContentLink;
      result.fileId = response.data.id;
      return result;
    }
    if (response.status === 308) {
      result.uploadedSize = Number(response.headers['range'].split('-')[1]);
    }
    return result;
  }

  private getFileMeta(data: drive_v3.Schema$File) {
    return {
      name: data.name as string,
      downloadLink: data.webContentLink as string,
      size: data.size as string,
    };
  }

  async makeFilePublic(fileId: string) {
    await this.driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        type: 'anyone',
        role: 'reader',
      },
    });
  }

  async clearDrive(): Promise<void> {
    const list = await this.driveClient.files.list();
    list.data.files?.forEach(async (file) => {
      await this.driveClient.files.delete({
        fileId: file.id!,
      });
    });
  }

  private createDriveClient(): drive_v3.Drive {
    return google.drive({ version: 'v3', auth: this.getGoogleAuth() });
  }

  getGoogleAuth(): GoogleAuth<JSONClient> {
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

  async getAuthToken(): Promise<string> {
    const auth = this.getGoogleAuth();
    const client = await auth.getClient();
    return (await client.getAccessToken()).token!;
  }

  async onModuleInit() {
    this.accessToken = await this.getAuthToken();
  }
}
