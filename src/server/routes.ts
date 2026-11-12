import express, { Request, Response } from "express";
import { parseVoiceInvoice, queryDues, generatePoliteReminder } from "./gemini";
import { createPayPalInvoice, testPayPalConnection } from "./paypal";

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Health check
apiRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    app: "BolPay",
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Voice invoice parsing endpoint
apiRouter.post("/ai/parse-voice", async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Voice transcription text is required" });
      return;
    }

    const result = await parseVoiceInvoice(text, language);
    res.json(result);
  } catch (error: any) {
    console.error("API /ai/parse-voice error:", error);
    res.status(500).json({ error: error.message || "Failed to parse voice invoice" });
  }
});

// "Who still owes me?" natural language query endpoint
apiRouter.post("/ai/ask-dues", async (req: Request, res: Response) => {
  try {
    const { query, invoices, language } = req.body;
    if (!query) {
      res.status(400).json({ error: "Query text is required" });
      return;
    }

    const result = await queryDues(query, invoices || [], language || "en");
    res.json(result);
  } catch (error: any) {
    console.error("API /ai/ask-dues error:", error);
    res.status(500).json({ error: error.message || "Failed to process dues query" });
  }
});

// Multilingual polite reminder with audio voice note
apiRouter.post("/ai/generate-reminder", async (req: Request, res: Response) => {
  try {
    const { invoice, tone, language } = req.body;
    if (!invoice) {
      res.status(400).json({ error: "Invoice is required" });
      return;
    }

    const reminder = await generatePoliteReminder(
      invoice,
      tone || "gentle",
      language || invoice.customer?.preferredLanguage || "en"
    );

    // Format WhatsApp and SMS URLs
    const encodedText = encodeURIComponent(reminder.messageText);
    const rawPhone = (invoice.customer?.phone || "").replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodedText}`;
    const smsUrl = `sms:${rawPhone}?body=${encodedText}`;

    res.json({
      ...reminder,
      whatsappUrl,
      smsUrl,
    });
  } catch (error: any) {
    console.error("API /ai/generate-reminder error:", error);
    res.status(500).json({ error: error.message || "Failed to generate reminder" });
  }
});

// PayPal Sandbox create invoice
apiRouter.post("/paypal/create-invoice", async (req: Request, res: Response) => {
  try {
    const { invoiceData, credentials } = req.body;
    if (!invoiceData) {
      res.status(400).json({ error: "Invoice data is required" });
      return;
    }

    const result = await createPayPalInvoice(invoiceData, credentials);
    res.json(result);
  } catch (error: any) {
    console.error("API /paypal/create-invoice error:", error);
    res.status(500).json({ error: error.message || "Failed to create PayPal invoice" });
  }
});

// PayPal Sandbox credentials test
apiRouter.post("/paypal/test-connection", async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret } = req.body;
    const result = await testPayPalConnection({ clientId, clientSecret });
    res.json(result);
  } catch (error: any) {
    console.error("API /paypal/test-connection error:", error);
    res.status(500).json({ error: error.message || "Failed to test PayPal connection" });
  }
});
