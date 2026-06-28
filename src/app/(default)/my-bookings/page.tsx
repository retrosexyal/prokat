import type { Metadata } from "next";
import { GuestBookingsClient } from "./GuestBookingsClient";

export const metadata: Metadata = {
  title: "Мои бронирования",
  robots: {
    index: false,
    follow: true,
  },
};

export default function MyBookingsPage() {
  return <GuestBookingsClient />;
}
