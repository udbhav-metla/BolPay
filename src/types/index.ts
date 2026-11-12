export type Language = 'en' | 'hi' | 'te';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredLanguage: Language;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  paypalInvoiceId?: string;
  customer: Customer;
  items: InvoiceItem[];
  currency: 'INR' | 'USD';
  subtotal: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAt?: string;
  serviceCategory: 'plumbing' | 'tutoring' | 'tailoring' | 'electrical' | 'carpentry' | 'other';
  notes?: string;
  paypalPaymentUrl: string;
  qrCodeUrl: string;
  detectedLanguage?: string;
  originalVoiceTranscript?: string;
}

export interface VoiceParseResult {
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  serviceDescription: string;
  serviceCategory: 'plumbing' | 'tutoring' | 'tailoring' | 'electrical' | 'carpentry' | 'other';
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  }>;
  totalAmount: number;
  currency: 'INR' | 'USD';
  dueDate: string;
  detectedLanguage: string;
  friendlySummary: string;
  confidenceScore: number;
}

export interface DuesQueryResult {
  spokenAnswer: string;
  totalPendingAmount: number;
  currency: string;
  matchingInvoiceIds: string[];
  summaryCards: Array<{
    title: string;
    value: string;
    detail: string;
  }>;
  audioBase64?: string;
}

export interface ReminderPayload {
  invoiceId: string;
  tone: 'gentle' | 'standard' | 'urgent';
  language: Language;
  messageText: string;
  audioBase64?: string;
  whatsappUrl: string;
  smsUrl: string;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  useLiveSandbox: boolean;
  merchantEmail: string;
  businessName: string;
}
