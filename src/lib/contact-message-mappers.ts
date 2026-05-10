import type {
  ContactMessageDoc,
  ContactMessageView,
} from "@/types/contact-message";

export function toContactMessageView(
  message: ContactMessageDoc,
): ContactMessageView {
  return {
    _id: message._id?.toString(),
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    isViewed: message.isViewed,
    viewedAt: message.viewedAt?.toISOString(),
    viewedByEmail: message.viewedByEmail,
    ip: message.ip,
    userAgent: message.userAgent,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

export function toContactMessageViews(
  messages: ContactMessageDoc[],
): ContactMessageView[] {
  return messages.map(toContactMessageView);
}