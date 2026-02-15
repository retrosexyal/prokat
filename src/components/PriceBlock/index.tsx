type Props = {
  pricePerDay: number;
};

export function PriceBlock({ pricePerDay }: Props) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-semibold">
        {pricePerDay} BYN
      </span>
      <span className="text-sm text-gray-500">/ сутки</span>
    </div>
  );
}
