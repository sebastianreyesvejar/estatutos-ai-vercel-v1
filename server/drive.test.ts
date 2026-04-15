import { describe, expect, it } from "vitest";
import { google } from "googleapis";

describe("Google Drive credentials", () => {
  it("should parse GOOGLE_SERVICE_ACCOUNT_JSON correctly", () => {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.type).toBe("service_account");
    expect(parsed.client_email).toContain("iam.gserviceaccount.com");
    expect(parsed.private_key).toContain("BEGIN PRIVATE KEY");
  });

  it("should have GOOGLE_DRIVE_FOLDER_ID set", () => {
    expect(process.env.GOOGLE_DRIVE_FOLDER_ID).toBeTruthy();
  });

  it("should create a valid GoogleAuth client", () => {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const credentials = JSON.parse(raw!);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    expect(auth).toBeTruthy();
  });
});
