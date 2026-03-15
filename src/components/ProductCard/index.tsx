import Link from "next/link";
import { AvailabilityBadge } from "../AvailabilityBadge";
import { PriceBlock } from "../PriceBlock";
import { RentButton } from "../RentButton";

type Props = {
  name: string;
  slug: string;
  image: string;
  pricePerDay: number;
  available: boolean;
};

export function ProductCard({
  name,
  slug,
  image,
  pricePerDay,
  available,
}: Props) {
  return (
    <div className="bg-white text-black rounded-xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition">
      {/* IMAGE */}
      <div className="relative bg-gray-50 aspect-[4/3] flex items-center justify-center">
        <img
          src={image || "/assets/no-image.webp"}
          alt={name}
          className="object-contain max-h-full"
        />
        <AvailabilityBadge available={available} />
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col gap-3">
        <h3 className="font-medium leading-snug line-clamp-2">{name}</h3>

        <PriceBlock pricePerDay={pricePerDay} />

        <div className="flex items-center justify-between gap-2">
          <RentButton available={available} />
          <Link
            href={`/product/${slug}`}
            className="text-sm text-gray-500 hover:text-black"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  );
}
