import { Injectable } from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigProvider } from 'src/configuration/configuration.provider';

@Injectable()
export class GoogleDriveUploader {
  private readonly driveClient: drive_v3.Drive;

  constructor(private readonly configProvider: ConfigProvider) {
    this.driveClient = this.createDriveClient();
  }

  private createDriveClient() {
    const credPath = path.join(
      process.cwd(),
      this.configProvider.googleCredFile(),
    );
    console.log(credPath);
    const auth = new google.auth.GoogleAuth({
      keyFile: credPath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return google.drive({ version: 'v3', auth });
  }

  async uploadFile(filePath: string): Promise<string> {
    try {
      const fileName = path.basename(filePath);
      const fileStream = fs.createReadStream(filePath);

      const response = await this.driveClient.files.create({
        requestBody: {
          name: fileName,
          parents: ['your-folder-id-here'],
        },
        media: {
          mimeType: 'application/octet-stream',
          body: fileStream,
        },
      });

      console.log('FileID: ' + response.data.id);
      return response.data.id?.toString() as string;
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      return '';
    }
  }
}
