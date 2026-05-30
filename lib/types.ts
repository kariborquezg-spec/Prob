export type BillingCycle = "monthly" | "annual" | "weekly" | "quarterly";
export type Currency = "USD" | "CLP" | "EUR" | "MXN" | "ARS" | "COP";
export type Category =
  | "streaming"
  | "music"
  | "productivity"
  | "gaming"
  | "cloud"
  | "news"
  | "fitness"
  | "education"
  | "finance"
  | "other";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  nextBillingDate: string; // ISO date string
  category: Category;
  color: string;
  icon?: string;
  email?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  logoUrl?: string;
}

export interface CatalogService {
  name: string;
  category: Category;
  color: string;
  emailDomains: string[];
  emailSubjects?: string[];
  logoUrl?: string;
  defaultPrice?: number;
  defaultCurrency?: Currency;
}

export interface GmailDetectedSubscription {
  service: CatalogService;
  emailFrom: string;
  emailSubject: string;
  detectedDate: string;
  estimatedPrice?: number;
  currency?: Currency;
  confirmed: boolean;
}
