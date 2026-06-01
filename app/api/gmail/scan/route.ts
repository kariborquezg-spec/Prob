import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { SERVICE_CATALOG } from "@/lib/catalog";
import { GmailDetectedSubscription } from "@/lib/types";

function extractPriceFromText(text: string): number | undefined {
  const match = text.match(/[\$€£]\s?(\d+[\.,]\d{2})/);
  return match ? parseFloat(match[1].replace(",", ".")) : undefined;
}

function extractAppNameFromSnippet(snippet: string, storeName: string): string | undefined {
  // Apple: "Invoice Date ... App Name $X.XX"
  // Play: "Your Google Play Order ... App Name"
  const lines = snippet.split(/[\n,|·•]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (
      line.length > 2 &&
      line.length < 60 &&
      !line.match(/^\d/) &&
      !line.match(/invoice|receipt|order|date|billed|total|subtotal|tax|thanks|thank you|apple|google|play/i)
    ) {
      return line;
    }
  }
  return undefined;
}

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
  const seenKeys = new Set<string>();

  for (const service of SERVICE_CATALOG) {
    try {
      const fromQuery = service.emailDomains.map((d) => `from:${d}`).join(" OR ");
      const query = `(${fromQuery}) (receipt OR invoice OR subscription OR suscripción OR payment OR billing OR recibo OR factura)`;

      if (service.isAggregator) {
        // For App Store / Play Store: fetch up to 10 emails and extract individual app names
        const res = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: 10,
        });

        if (!res.data.messages) continue;

        for (const msgRef of res.data.messages) {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: msgRef.id!,
            format: "full",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = msg.data.payload?.headers || [];
          const subjectHeader = headers.find((h) => h.name === "Subject")?.value || "";
          const fromHeader = headers.find((h) => h.name === "From")?.value || "";
          const dateHeader = headers.find((h) => h.name === "Date")?.value || "";
          const snippet = msg.data.snippet || "";

          const detectedName = extractAppNameFromSnippet(snippet, service.name) || subjectHeader;
          const estimatedPrice = extractPriceFromText(snippet) || extractPriceFromText(subjectHeader);

          const key = `${service.name}:${detectedName}`;
          if (!seenKeys.has(key)) {
            detected.push({
              service,
              emailFrom: fromHeader,
              emailSubject: subjectHeader,
              detectedDate: dateHeader,
              estimatedPrice,
              currency: service.defaultCurrency,
              confirmed: false,
              detectedName,
            });
            seenKeys.add(key);
          }
        }
      } else {
        // Regular service: one entry per service
        const res = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: 3,
        });

        if (!res.data.messages || res.data.messages.length === 0) continue;
        if (seenKeys.has(service.name)) continue;

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
        const estimatedPrice = priceMatch ? parseFloat(priceMatch[1]) : service.defaultPrice;

        detected.push({
          service,
          emailFrom: fromHeader,
          emailSubject: subjectHeader,
          detectedDate: dateHeader,
          estimatedPrice,
          currency: service.defaultCurrency,
          confirmed: false,
        });

        seenKeys.add(service.name);
      }
    } catch {
      // Skip this service if scan fails
    }
  }

  return NextResponse.json({ detected });
}
