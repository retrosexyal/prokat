import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import {
  createMonetizationRequest,
  getMonetizationRequestsForUser,
  updateMonetizationRequestPayment,
} from "@/lib/monetization-requests";
import {
  toMonetizationRequestView,
  toMonetizationRequestViews,
} from "@/lib/monetization-mappers";
import {
  createExpressPayInvoice,
  getExpressPayInvoiceStatus,
  getMonetizationPricing,
} from "@/lib/express-pay";
import type { UserType } from "@/types";
import type { ProductDoc } from "@/types/product";
import type {
  MonetizationRequestDoc,
  MonetizationRequestType,
} from "@/types/monetization";

const ALLOWED_TYPES: MonetizationRequestType[] = [
  "increase_limit",
  "boost_product",
];
const PAYMENT_LIFETIME_MS = 24 * 60 * 60 * 1000;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildAccountNo(
  requestId: string,
  type: MonetizationRequestType,
): string {
  const prefix = type === "boost_product" ? "BOOST" : "LIMIT";
  return `${prefix}-${requestId.slice(-18)}`.slice(0, 30);
}

function mapProviderStatusToPatch(
  requestDoc: MonetizationRequestDoc,
  providerStatus?: number,
): Partial<MonetizationRequestDoc> | null {
  switch (providerStatus) {
    case 1:
      return {
        paymentStatus: "invoice_created",
        paymentError: undefined,
      };

    case 3:
    case 6:
      return {
        paymentStatus: "paid",
        paymentError: undefined,
        status: requestDoc.status === "completed" ? "completed" : "paid",
        processedAt: requestDoc.processedAt ?? new Date(),
      };

    case 2:
      return {
        paymentStatus: "failed",
        paymentError: "Срок действия счёта истёк",
      };

    case 4:
      return {
        paymentStatus: "failed",
        paymentError: "Счёт оплачен частично",
      };

    case 5:
      return {
        paymentStatus: "failed",
        paymentError: "Счёт отменён",
      };

    case 7:
      return {
        paymentStatus: "failed",
        paymentError: "Платёж был возвращён",
      };

    default:
      return null;
  }
}

async function syncRequestPaymentState(
  requestDoc: MonetizationRequestDoc,
): Promise<MonetizationRequestDoc> {
  if (
    !requestDoc._id ||
    !requestDoc.paymentInvoiceNo ||
    !["pending", "invoice_created"].includes(requestDoc.paymentStatus)
  ) {
    return requestDoc;
  }

  try {
    const providerState = await getExpressPayInvoiceStatus(
      Number(requestDoc.paymentInvoiceNo),
    );

    const patch = mapProviderStatusToPatch(requestDoc, providerState.Status);

    if (!patch) {
      return requestDoc;
    }

    const hasChanges = Object.entries(patch).some(([key, value]) => {
      const currentValue = requestDoc[key as keyof MonetizationRequestDoc];
      return currentValue !== value;
    });

    if (!hasChanges) {
      return requestDoc;
    }

    const updated = await updateMonetizationRequestPayment(
      String(requestDoc._id),
      patch,
    );

    return updated ?? requestDoc;
  } catch {
    return requestDoc;
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const onlyActive = request.nextUrl.searchParams.get("onlyActive") === "1";

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection<UserType>("users").findOne({
    email: session.user.email,
  });

  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const requests = await getMonetizationRequestsForUser(user._id, {
    onlyActive,
  });

  const synced = await Promise.all(requests.map(syncRequestPaymentState));

  return NextResponse.json(toMonetizationRequestViews(synced));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type?: MonetizationRequestType;
    productId?: string;
    message?: string;
    requestedLimitIncrease?: number;
    requestedBoostValue?: number;
  };

  const type = body.type;
  const message = String(body.message ?? "").trim();
  const requestedLimitIncrease = Number(body.requestedLimitIncrease ?? 0);
  const requestedBoostValue = Number(body.requestedBoostValue ?? 0);
  const productId = String(body.productId ?? "").trim();

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Некорректный тип заявки" },
      { status: 400 },
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection<UserType>("users").findOne({
    email: session.user.email,
  });

  if (!user?._id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let product: ProductDoc | null = null;

  if (type === "boost_product") {
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Некорректный товар" },
        { status: 400 },
      );
    }

    product = await db.collection<ProductDoc>("products").findOne({
      _id: new ObjectId(productId),
      ownerId: user._id as ObjectId,
    });

    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    if (requestedBoostValue < 1) {
      return NextResponse.json(
        { error: "Укажите, на сколько повысить рейтинг" },
        { status: 400 },
      );
    }
  }

  if (type === "increase_limit" && requestedLimitIncrease < 1) {
    return NextResponse.json(
      { error: "Укажите, на сколько увеличить лимит" },
      { status: 400 },
    );
  }

  const pricing = getMonetizationPricing();
  const paymentAmountBYN =
    type === "increase_limit"
      ? roundMoney(requestedLimitIncrease * pricing.limitPricePerItemBYN)
      : roundMoney(requestedBoostValue * pricing.boostPricePerPointBYN);

  if (!Number.isFinite(paymentAmountBYN) || paymentAmountBYN <= 0) {
    return NextResponse.json(
      { error: "Не удалось рассчитать стоимость услуги" },
      { status: 500 },
    );
  }

  const created = await createMonetizationRequest({
    userId: user._id as ObjectId,
    userEmail: session.user.email,
    type,
    status: "pending",
    productId: product?._id,
    productName: product?.name,
    message,
    requestedLimitIncrease:
      type === "increase_limit" ? requestedLimitIncrease : undefined,
    requestedBoostValue:
      type === "boost_product" ? requestedBoostValue : undefined,
    paymentProvider: "erip",
    paymentStatus: "pending",
    paymentAmountBYN,
    paymentCurrency: 933,
  });

  const accountNo = buildAccountNo(String(created._id), type);
  const info =
    type === "increase_limit"
      ? `Увеличение лимита объявлений на ${requestedLimitIncrease}`
      : `Повышение рейтинга товара ${product?.name ?? ""} на ${requestedBoostValue}`.trim();

  const paymentExpiresAt = new Date(Date.now() + PAYMENT_LIFETIME_MS);

  try {
    const invoice = await createExpressPayInvoice({
      accountNo,
      amount: paymentAmountBYN,
      info,
      emailNotification: session.user.email,
      returnInvoiceUrl: 1,
      expiration: paymentExpiresAt,
    });

    const updated = await updateMonetizationRequestPayment(
      String(created._id),
      {
        paymentStatus: "invoice_created",
        paymentAccountNo: accountNo,
        paymentInvoiceNo: invoice.InvoiceNo,
        paymentInvoiceUrl: invoice.InvoiceUrl,
        paymentExpiresAt,
        paymentError: undefined,
        paymentStubNote: undefined,
      },
    );

    return NextResponse.json(toMonetizationRequestView(updated ?? created), {
      status: 201,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Не удалось создать счёт";

    const updated = await updateMonetizationRequestPayment(
      String(created._id),
      {
        paymentStatus: "failed",
        paymentAccountNo: accountNo,
        paymentExpiresAt,
        paymentError: errorMessage,
      },
    );

    return NextResponse.json(
      {
        error: errorMessage,
        request: toMonetizationRequestView(updated ?? created),
      },
      { status: 502 },
    );
  }
}