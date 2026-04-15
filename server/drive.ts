import { google } from "googleapis";
import { Readable } from "stream";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  parents?: string[];
  modifiedTime?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

function getOAuth2Client(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

function getServiceAccountClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentials) return null;
  try {
    const parsed = JSON.parse(credentials);
    return new google.auth.GoogleAuth({
      credentials: parsed,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  } catch {
    return null;
  }
}

export async function getDriveClient(accessToken?: string) {
  if (accessToken) {
    return google.drive({ version: "v3", auth: getOAuth2Client(accessToken) });
  }
  const serviceAuth = getServiceAccountClient();
  if (serviceAuth) {
    return google.drive({ version: "v3", auth: serviceAuth });
  }
  throw new Error("No Google Drive credentials available. Configure GOOGLE_SERVICE_ACCOUNT_JSON or provide an access token.");
}

export async function listFolderContents(folderId: string, accessToken?: string): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {
  const drive = await getDriveClient(accessToken);
  const files: DriveFile[] = [];
  const folders: DriveFolder[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size, webViewLink, parents, modifiedTime)",
      pageSize: 1000,
      pageToken,
    });
    const items = response.data.files ?? [];
    for (const item of items) {
      if (!item.id || !item.name) continue;
      if (item.mimeType === "application/vnd.google-apps.folder") {
        folders.push({ id: item.id, name: item.name });
      } else if (item.mimeType === "application/pdf") {
        files.push({
          id: item.id,
          name: item.name,
          mimeType: item.mimeType,
          size: item.size ? parseInt(item.size) : undefined,
          webViewLink: item.webViewLink ?? undefined,
          parents: item.parents ?? undefined,
          modifiedTime: item.modifiedTime ?? undefined,
        });
      }
    }
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return { files, folders };
}

export async function downloadFileAsBuffer(fileId: string, accessToken?: string): Promise<Buffer> {
  const drive = await getDriveClient(accessToken);
  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = response.data as unknown as Readable;
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function getFileMetadata(fileId: string, accessToken?: string): Promise<DriveFile | null> {
  try {
    const drive = await getDriveClient(accessToken);
    const response = await drive.files.get({ fileId, fields: "id, name, mimeType, size, webViewLink, parents, modifiedTime" });
    const f = response.data;
    if (!f.id || !f.name) return null;
    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType ?? "application/pdf",
      size: f.size ? parseInt(f.size) : undefined,
      webViewLink: f.webViewLink ?? undefined,
      parents: f.parents ?? undefined,
      modifiedTime: f.modifiedTime ?? undefined,
    };
  } catch {
    return null;
  }
}
