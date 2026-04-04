import type {
  MonetizationRequestDoc,
  MonetizationRequestView,
} from "@/types/monetization";

export function toMonetizationRequestView(
  request: MonetizationRequestDoc,
): MonetizationRequestView {
  return {
    _id: request._id?.toString(),
    userId: request.userId.toString(),
    userEmail: request.userEmail,
    type: request.type,
    status: request.status,
    productId: request.productId?.toString(),
    productName: request.productName,
    message: request.message,
    requestedLimitIncrease: request.requestedLimitIncrease,
    requestedBoostValue: request.requestedBoostValue,
    paymentProvider: request.paymentProvider,
    paymentStatus: request.paymentStatus,
    paymentStubNote: request.paymentStubNote,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    processedAt: request.processedAt?.toISOString(),
    processedByEmail: request.processedByEmail,
  };
}

export function toMonetizationRequestViews(
  requests: MonetizationRequestDoc[],
): MonetizationRequestView[] {
  return requests.map(toMonetizationRequestView);
}