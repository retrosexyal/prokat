import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { isAdminEmail } from "@/lib/auth";
import {
  updateMonetizationRequestPayment,
  updateMonetizationRequestStatus,
} from "@/lib/monetization-requests";
import { toMonetizationRequestView } from "@/lib/monetization-mappers";
import { getExpressPayInvoiceStatus } from "@/lib/express-pay";
import {
  BOOST_FIXED_VALUE,
  calculateBoostExpiration,
} from "@/lib/boost-pricing";
import type {
  MonetizationRequestDoc,
  MonetizationRequestStatus,
} from "@/types/monetization";
import type { UserType } from "@/types";
import type { ProductDoc } from "@/types/product";

const ALLOWED_STATUSES: MonetizationRequestStatus[] = [
  "pending",
  "paid",
  "completed",
  "cancelled",
];

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UserDbDoc = UserType & {
  _id: ObjectId;
};

type ProductDbDoc = ProductDoc & {
  _id: ObjectId;
};

function toObjectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) {
    return value;
  }

  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }

  return null;
}

function mapProviderStatusToPatch(
  requestDoc: MonetizationRequestDoc,
  providerStatus?: number,
): {
  paymentPatch: Partial<MonetizationRequestDoc>;
  nextStatus?: MonetizationRequestStatus;
} | null {
  switch (providerStatus) {
    case 1:
      return {
        paymentPatch: {
          paymentStatus: "invoice_created",
          paymentError: undefined,
        },
      };

    case 2:
      return {
        paymentPatch: {
          paymentStatus: "failed",
          paymentError: "Срок действия счёта истёк",
        },
      };

    case 3:
    case 6:
      return {
        paymentPatch: {
          paymentStatus: "paid",
          paymentError: undefined,
        },
        nextStatus: requestDoc.status === "completed" ? "completed" : "paid",
      };

    case 4:
      return {
        paymentPatch: {
          paymentStatus: "failed",
          paymentError: "Счёт оплачен частично",
        },
      };

    case 5:
      return {
        paymentPatch: {
          paymentStatus: "failed",
          paymentError: "Счёт отменён",
        },
      };

    case 7:
      return {
        paymentPatch: {
          paymentStatus: "failed",
          paymentError: "Платёж был возвращён",
        },
      };

    default:
      return null;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    status?: MonetizationRequestStatus;
    applyBoost?: boolean;
    applyLimitIncrease?: boolean;
    syncPayment?: boolean;
    revertExpiredBoost?: boolean;
  };

  const status = body.status;
  const applyBoost = Boolean(body.applyBoost);
  const applyLimitIncrease = Boolean(body.applyLimitIncrease);
  const syncPayment = Boolean(body.syncPayment);
  const revertExpiredBoost = Boolean(body.revertExpiredBoost);

  const client = await clientPromise;
  const db = client.db();

  const existing = await db
    .collection<MonetizationRequestDoc>("monetizationRequests")
    .findOne({
      _id: new ObjectId(id),
    });

  if (!existing) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (revertExpiredBoost) {
    const productId = toObjectId(existing.productId);

    if (!productId) {
      return NextResponse.json(
        { error: "У заявки отсутствует корректный productId" },
        { status: 400 },
      );
    }

    const product = await db.collection<ProductDbDoc>("products").findOne({
      _id: productId,
    });

    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    if (
      !(product.boostExpiresAt instanceof Date) ||
      product.boostExpiresAt.getTime() > Date.now()
    ) {
      return NextResponse.json(
        { error: "Срок действия буста ещё не закончился" },
        { status: 400 },
      );
    }

    if (typeof product.boostRestoreValue !== "number") {
      return NextResponse.json(
        { error: "Не найдено значение рейтинга для восстановления" },
        { status: 400 },
      );
    }

    await db.collection<ProductDbDoc>("products").updateOne(
      { _id: productId },
      {
        $set: {
          ratingBoost: product.boostRestoreValue,
          priorityScore: product.boostRestoreValue,
          updatedAt: new Date(),
        },
        $unset: {
          boostRestoreValue: "",
          boostAppliedAt: "",
          boostExpiresAt: "",
          boostDuration: "",
        },
      },
    );

    const latest = await db
      .collection<MonetizationRequestDoc>("monetizationRequests")
      .findOne({
        _id: new ObjectId(id),
      });

    return NextResponse.json(latest ? toMonetizationRequestView(latest) : null);
  }

  if (syncPayment) {
    if (!existing.paymentInvoiceNo) {
      return NextResponse.json(
        { error: "У заявки нет номера счёта" },
        { status: 400 },
      );
    }

    try {
      const providerState = await getExpressPayInvoiceStatus(
        Number(existing.paymentInvoiceNo),
      );

      const mapped = mapProviderStatusToPatch(existing, providerState.Status);

      if (!mapped) {
        return NextResponse.json(
          { error: "Не удалось определить статус оплаты" },
          { status: 502 },
        );
      }

      let updated = await updateMonetizationRequestPayment(
        id,
        mapped.paymentPatch,
      );

      if (mapped.nextStatus) {
        const processedByEmail =
          typeof session?.user?.email === "string"
            ? session.user.email
            : undefined;

        updated = await updateMonetizationRequestStatus(
          id,
          mapped.nextStatus,
          processedByEmail,
        );
      }

      const latest = await db
        .collection<MonetizationRequestDoc>("monetizationRequests")
        .findOne({
          _id: new ObjectId(id),
        });

      return NextResponse.json(
        latest ? toMonetizationRequestView(latest) : null,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось проверить статус оплаты";

      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  if (status === "completed") {
    if (existing.paymentStatus !== "paid") {
      return NextResponse.json(
        {
          error:
            "Нельзя применить заявку, пока оплата не подтверждена. Сначала нажмите «Проверить оплату».",
        },
        { status: 400 },
      );
    }

    const existingProductId = toObjectId(existing.productId);
    const existingUserId = toObjectId(existing.userId);

    if (applyBoost && existing.type === "boost_product") {
      if (!existingProductId) {
        return NextResponse.json(
          { error: "У заявки отсутствует корректный productId" },
          { status: 400 },
        );
      }

      const product = await db.collection<ProductDbDoc>("products").findOne({
        _id: existingProductId,
      });

      if (!product) {
        return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
      }

      const currentRating = Number(product.ratingBoost ?? 0);
      const boostValue = Number(existing.requestedBoostValue ?? BOOST_FIXED_VALUE);
      const appliedAt = new Date();
      const expiresAt = existing.boostDuration
        ? calculateBoostExpiration(existing.boostDuration, appliedAt)
        : existing.boostExpiresAt ?? appliedAt;

      await db.collection<ProductDbDoc>("products").updateOne(
        { _id: existingProductId },
        {
          $set: {
            ratingBoost: currentRating + boostValue,
            priorityScore: currentRating + boostValue,
            boostRestoreValue: currentRating,
            boostAppliedAt: appliedAt,
            boostExpiresAt: expiresAt,
            boostDuration: existing.boostDuration,
            updatedAt: appliedAt,
          },
        },
      );

      await db
        .collection<MonetizationRequestDoc>("monetizationRequests")
        .updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              boostAppliedAt: appliedAt,
              boostExpiresAt: expiresAt,
              updatedAt: new Date(),
            },
          },
        );
    }

    if (applyLimitIncrease && existing.type === "increase_limit") {
      if (!existingUserId) {
        return NextResponse.json(
          { error: "У заявки отсутствует корректный userId" },
          { status: 400 },
        );
      }

      await db.collection<UserDbDoc>("users").updateOne(
        { _id: existingUserId },
        {
          $inc: { productLimit: Number(existing.requestedLimitIncrease ?? 0) },
        },
      );
    }
  }

  if (status === "paid" || status === "completed") {
    await updateMonetizationRequestPayment(id, {
      paymentStatus: "paid",
      paymentError: undefined,
    });
  }

  if (status === "cancelled") {
    await updateMonetizationRequestPayment(id, {
      paymentStatus:
        existing.paymentStatus === "paid" ? existing.paymentStatus : "failed",
    });
  }

  const processedByEmail =
    typeof session?.user?.email === "string" ? session.user.email : undefined;

  const updated = await updateMonetizationRequestStatus(
    id,
    status,
    processedByEmail,
  );

  return NextResponse.json(updated ? toMonetizationRequestView(updated) : null);
}