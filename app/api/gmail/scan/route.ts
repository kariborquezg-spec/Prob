import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { SERVICE_CATALOG } from "@/lib/catalog";
import { GmailDetectedSubscription } from "@/lib/types";

export async function GET() {
  const session = await auth() as ({ accessToken?: string } & Record<string, unknown>) | null;

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = session.accessToken;

  const oauthClient = new google.auth.OAuth2();
  oauthClient.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauthClient });

  const detected: GmailDetectedSubscription[] = [];
  const seenServices = new Set<string>();

  for (const service of SERVICE_CATALOG) {
    try {
      const fromQuery = service.emailDomains
        .map((d) => `from:${d}`)
        .join(" OR ");

      const query = `(${fromQuery}) (receipt OR invoice OR subscription OR suscripción OR payment OR billing OR recibo OR factura)`;

      const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 3,
      });

      if (res.data.messages && res.data.messages.length > 0 && !seenServices.has(service.name)) {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: res.data.messages[0].id!,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers = msg.data.payload?.headers || [];
        const fromHeader = headers.find((h) => h.name === "From")?.value || "";
        const subjectHeader = headers.find((h) => h.name === "Subject")?.value || "";
        const dateHeader = headers.find((h) => h.name === "Date")?.value || "";

        const priceMatch = subjectHeader.match(/\$\s?(\d+\.?\d*)/);
        const estimatedPrice = priceMatch
          ? parseFloat(priceMatch[1])
          : service.defaultPrice;

        detected.push({
          service,
          emailFrom: fromHeader,
          emailSubject: subjectHeader,
          detectedDate: dateHeader,
          estimatedPrice,
          currency: service.defaultCurrency,
          confirmed: false,
        });

        seenServices.add(service.name);
      }
    } catch {
      // Skip this service if scan fails
    }
  }

  return NextResponse.json({ detected });
}
