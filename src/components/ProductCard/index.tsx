"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AvailabilityBadge } from "../AvailabilityBadge";
import { PriceBlock } from "../PriceBlock";
import { RentButton } from "../RentButton";
import { Modal } from "../ui/Modal";
import { ProductBookingForm } from "../ProductBookingForm";

type Props = {
  productId: string;
  name: string;
  slug: string;
  images?: string[];
  pricePerDay: number;
  minDays: number;
  available: boolean;
};

const FALLBACK_IMAGE = "/assets/no-image.webp";

export function ProductCard({
  productId,
  name,
  slug,
  images = [],
  pricePerDay,
  minDays,
  available,
}: Props) {
  const normalizedImages = useMemo(() => {
    const filtered = images.filter(Boolean);
    return filtered.length > 0 ? filtered : [FALLBACK_IMAGE];
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const effectSelect = useEffectEvent(() => setSelectedIndex(0));

  useEffect(() => {
    effectSelect();
  }, [images]);

  const selectedImage = normalizedImages[selectedIndex] ?? FALLBACK_IMAGE;
  const showThumbnails = normalizedImages.length > 1;

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-black/5 bg-white text-black shadow-sm transition hover:shadow-md">
        <button
          type="button"
          onClick={() => setIsImageModalOpen(true)}
          className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-50"
          aria-label={`Открыть изображение товара ${name}`}
        >
          <img
            src={selectedImage}
            alt={name}
            className="h-full w-full object-contain"
          />
          <AvailabilityBadge available={available} />
        </button>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-3 min-h-[64px]">
            {showThumbnails ? (
              <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1">
                {normalizedImages.map((img, index) => {
                  const isActive = index === selectedIndex;

                  return (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      aria-label={`Показать изображение ${index + 1}`}
                      className={[
                        "shrink-0 overflow-hidden rounded-lg border transition",
                        isActive
                          ? "border-black ring-2 ring-black/20"
                          : "border-black/10 opacity-80 hover:opacity-100",
                      ].join(" ")}
                    >
                      <img
                        src={img}
                        alt={`${name} ${index + 1}`}
                        className="h-14 w-14 bg-gray-50 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-14" />
            )}
          </div>

          <h3 className="min-h-[48px] font-medium leading-snug line-clamp-2">
            {name}
          </h3>

          <div className="mt-2">
            <PriceBlock pricePerDay={pricePerDay} />
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <RentButton
              available={available}
              onClick={() => setIsBookingModalOpen(true)}
            />

            <Link
              href={`/product/${slug}`}
              className="text-sm text-gray-500 hover:text-black"
            >
              Подробнее
            </Link>
          </div>
        </div>
      </div>

      <Modal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        panelClassName="w-full max-w-6xl rounded-2xl bg-white p-4 shadow-xl sm:p-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex h-[75vh] items-center justify-center rounded-xl bg-black/5">
            <img
              src={selectedImage}
              alt={name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {showThumbnails ? (
            <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1">
              {normalizedImages.map((img, index) => {
                const isActive = index === selectedIndex;

                return (
                  <button
                    key={`modal-${img}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`Показать изображение ${index + 1} в модальном окне`}
                    className={[
                      "shrink-0 overflow-hidden rounded-lg border transition",
                      isActive
                        ? "border-black ring-2 ring-black/20"
                        : "border-black/10 opacity-80 hover:opacity-100",
                    ].join(" ")}
                  >
                    <img
                      src={img}
                      alt={`${name} ${index + 1}`}
                      className="h-16 w-16 bg-gray-50 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={isBookingModalOpen}
        title={`Бронирование: ${name}`}
        onClose={() => setIsBookingModalOpen(false)}
        panelClassName="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl sm:p-6"
      >
        <ProductBookingForm productId={productId} minDays={minDays} />
      </Modal>
    </>
  );
}

/*   const effectSelect = useEffectEvent(() => setSelectedIndex(0));

  useEffect(() => {
    effectSelect();
  }, [images]); */
