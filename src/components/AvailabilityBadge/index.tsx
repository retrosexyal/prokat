type Props = {
  available: boolean;
};

export function AvailabilityBadge({ available }: Props) {
  return (
    <span
      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
        available
          ? "bg-green-100 text-green-700"
          : "bg-gray-200 text-gray-500"
      }`}
    >
      {available ? "Доступно сейчас" : "Под заказ"}
    </span>
  );
}
