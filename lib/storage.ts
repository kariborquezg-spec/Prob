import { Subscription } from "./types";

const STORAGE_KEY = "subtracker_subscriptions";
const GMAIL_ACCOUNTS_KEY = "subtracker_gmail_accounts";

export function getSubscriptions(): Subscription[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSubscriptions(subs: Subscription[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

export function addSubscription(sub: Subscription): void {
  const subs = getSubscriptions();
  saveSubscriptions([...subs, sub]);
}

export function updateSubscription(updated: Subscription): void {
  const subs = getSubscriptions();
  saveSubscriptions(subs.map((s) => (s.id === updated.id ? updated : s)));
}

export function deleteSubscription(id: string): void {
  const subs = getSubscriptions();
  saveSubscriptions(subs.filter((s) => s.id !== id));
}

export function getConnectedEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GMAIL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addConnectedEmail(email: string): void {
  const emails = getConnectedEmails();
  if (!emails.includes(email)) {
    localStorage.setItem(GMAIL_ACCOUNTS_KEY, JSON.stringify([...emails, email]));
  }
}

export function removeConnectedEmail(email: string): void {
  const emails = getConnectedEmails();
  localStorage.setItem(
    GMAIL_ACCOUNTS_KEY,
    JSON.stringify(emails.filter((e) => e !== email))
  );
}

export function getMonthlyTotal(subs: Subscription[]): number {
  return subs
    .filter((s) => s.active)
    .reduce((total, s) => {
      if (s.billingCycle === "monthly") return total + s.price;
      if (s.billingCycle === "annual") return total + s.price / 12;
      if (s.billingCycle === "weekly") return total + s.price * 4.33;
      if (s.billingCycle === "quarterly") return total + s.price / 3;
      return total;
    }, 0);
}

export function getAnnualTotal(subs: Subscription[]): number {
  return getMonthlyTotal(subs) * 12;
}

export function getDaysUntilBilling(nextBillingDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const billing = new Date(nextBillingDate);
  billing.setHours(0, 0, 0, 0);
  const diff = billing.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
