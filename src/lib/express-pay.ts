import crypto from "crypto";

const DEFAULT_LIMIT_PRICE_PER_ITEM_BYN = 10;
const DEFAULT_BOOST_PRICE_PER_POINT_BYN = 2;

type ExpressPayInvoiceRequest = {
  accountNo: string;
  amount: number;
  info: string;
  emailNotification?: string;
  returnInvoiceUrl?: 0 | 1;
  expiration?: Date;
};

export type ExpressPayInvoiceResponse = {
  InvoiceNo?: number;
  InvoiceUrl?: string;
  Error?: {
    Code?: number;
    Msg?: string;
    MsgCode?: number;
  };
};

export type MonetizationPricing = {
  limitPricePerItemBYN: number;
  boostPricePerPointBYN: number;
};

function getEnv(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function getExpressPayBaseUrl(): string {
  const customBaseUrl = getEnv("EXPRESS_PAY_API_BASE_URL");
  if (customBaseUrl) {
    return customBaseUrl.replace(/\/$/, "");
  }

  const useSandbox = getEnv("EXPRESS_PAY_USE_SANDBOX") === "true";
  return useSandbox
    ? "https://sandbox-api.express-pay.by/v1"
    : "https://api.express-pay.by/v1";
}

export function getMonetizationPricing(): MonetizationPricing {
  return {
    limitPricePerItemBYN: Number(
      process.env.EXPRESS_PAY_LIMIT_PRICE_PER_ITEM_BYN ??
        DEFAULT_LIMIT_PRICE_PER_ITEM_BYN,
    ),
    boostPricePerPointBYN: Number(
      process.env.EXPRESS_PAY_BOOST_PRICE_PER_POINT_BYN ??
        DEFAULT_BOOST_PRICE_PER_POINT_BYN,
    ),
  };
}

export function ensureExpressPayConfigured(): {
  token: string;
  secretWord?: string;
} {
  const token = getEnv("EXPRESS_PAY_TOKEN");

  if (!token) {
    throw new Error("Не задан EXPRESS_PAY_TOKEN");
  }

  const secretWord = getEnv("EXPRESS_PAY_SECRET_WORD");

  return {
    token,
    secretWord: secretWord || undefined,
  };
}

function toAmountString(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatExpiration(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

function computeSignature(
  params: Record<string, string>,
  secretWord: string,
): string {
  const mapping = [
    "Token",
    "AccountNo",
    "Amount",
    "Currency",
    "Expiration",
    "Info",
    "Surname",
    "FirstName",
    "Patronymic",
    "City",
    "Street",
    "House",
    "Building",
    "Apartment",
    "IsNameEditable",
    "IsAddressEditable",
    "IsAmountEditable",
    "EmailNotification",
    "ReturnInvoiceUrl",
  ] as const;

  const raw = mapping.map((key) => params[key] ?? "").join("");

  return crypto
    .createHmac("sha1", Buffer.from(secretWord, "utf8"))
    .update(Buffer.from(raw, "utf8"))
    .digest("hex")
    .toUpperCase();
}

export async function createExpressPayInvoice(
  input: ExpressPayInvoiceRequest,
): Promise<ExpressPayInvoiceResponse> {
  const { token, secretWord } = ensureExpressPayConfigured();

  const expiration = formatExpiration(
    input.expiration ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
  );

  const params: Record<string, string> = {
    Token: token,
    AccountNo: input.accountNo,
    Amount: toAmountString(input.amount),
    Currency: "933",
    Info: input.info,
    IsNameEditable: "0",
    IsAddressEditable: "0",
    IsAmountEditable: "0",
    EmailNotification: input.emailNotification ?? "",
    ReturnInvoiceUrl: String(input.returnInvoiceUrl ?? 1),
    Expiration: expiration,
  };

  if (secretWord) {
    params.signature = computeSignature(params, secretWord);
  }

  const url = `${getExpressPayBaseUrl()}/invoices?token=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams(params).toString(),
    cache: "no-store",
  });

  const text = await response.text();

  let json: ExpressPayInvoiceResponse | null = null;

  try {
    json = JSON.parse(text) as ExpressPayInvoiceResponse;
  } catch {
    throw new Error(`Express-Pay вернул неожиданный ответ: ${text}`);
  }

  if (!response.ok) {
    const message = json?.Error?.Msg || `HTTP ${response.status}`;
    throw new Error(`Ошибка Express-Pay: ${message}`);
  }

  if (json?.Error) {
    throw new Error(
      `Ошибка Express-Pay: ${json.Error.Msg ?? "неизвестная ошибка"}`,
    );
  }

  return json ?? {};
}

export type ExpressPayInvoiceStatusResponse = {
  InvoiceNo?: number;
  Status?: number;
  StatusName?: string;
  Amount?: number;
  AccountNo?: string;
  Error?: {
    Code?: number;
    Msg?: string;
    MsgCode?: number;
  };
};

export async function getExpressPayInvoiceStatus(
  invoiceNo: number,
): Promise<ExpressPayInvoiceStatusResponse> {
  const { token } = ensureExpressPayConfigured();

  const url = `${getExpressPayBaseUrl()}/invoices/${invoiceNo}/status?token=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const text = await response.text();

  let json: ExpressPayInvoiceStatusResponse | null = null;

  try {
    json = JSON.parse(text) as ExpressPayInvoiceStatusResponse;
  } catch {
    throw new Error(`Express-Pay вернул неожиданный ответ: ${text}`);
  }

  if (!response.ok) {
    const message = json?.Error?.Msg || `HTTP ${response.status}`;
    throw new Error(`Ошибка Express-Pay: ${message}`);
  }

  if (json?.Error) {
    throw new Error(
      `Ошибка Express-Pay: ${json.Error.Msg ?? "неизвестная ошибка"}`,
    );
  }

  return json ?? {};
}