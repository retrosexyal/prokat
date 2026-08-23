type ReservedBooking = {
  startDate: Date;
  endDate: Date;
  quantity?: number;
};

export function getPeakReservedQuantity(
  bookings: ReservedBooking[],
  startDate: Date,
  endDate: Date,
): number {
  let peak = 0;
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);

  const lastDay = new Date(endDate);
  lastDay.setUTCHours(0, 0, 0, 0);

  while (cursor <= lastDay) {
    const reserved = bookings.reduce(
      (total, booking) =>
        total +
        (booking.startDate <= cursor && booking.endDate >= cursor
          ? booking.quantity ?? 1
          : 0),
      0,
    );

    peak = Math.max(peak, reserved);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return peak;
}
