import { google, type sheets_v4 } from "googleapis";

let cachedSheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (cachedSheetsClient) return cachedSheetsClient;

  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    throw new Error(
      "Google Sheets credentials missing: set GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY",
    );
  }

  // Env-stored private keys have their newlines escaped as literal "\n".
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedSheetsClient = google.sheets({ version: "v4", auth });
  return cachedSheetsClient;
}

type AppendRowArgs = {
  tab: string;
  values: (string | number | null | undefined)[];
};

export async function appendRowToSubmissionsSheet({
  tab,
  values,
}: AppendRowArgs) {
  const spreadsheetId = process.env.SUBMISSIONS_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error("SUBMISSIONS_SHEET_ID env var is required");
  }

  const sheets = getSheetsClient();

  const normalized = values.map((v) => v ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [normalized] },
  });
}
