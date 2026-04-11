"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AvailabilityBadge } from "../AvailabilityBadge";
import { PriceBlock } from "../PriceBlock";
import { Modal } from "../ui/Modal";
import { ProductBookingForm } from "../ProductBookingForm";
import { Button } from "../ui/Button";
import type { CitySlug } from "@/lib/cities";
import { getProductPath } from "@/lib/routes";
import { BOOST_HIGHLIGHT_THRESHOLD } from "@/lib/boost-pricing";

type Props = {
  productId: string;
  name: string;
  slug: string;
  category: string;
  citySlug: CitySlug;
  images?: string[];
  pricePerDay: number;
  minDays: number;
  available: boolean;
  ownerPhone?: string;
  isHideButton?: boolean;
  pickupAddress?: string;
  ratingBoost?: number;
};

const FALLBACK_IMAGE = "/assets/no-image.webp";

function buildImageAlt(name: string, index?: number) {
  if (typeof index === "number") {
    return `${name} в аренду — фото ${index + 1}`;
  }

  return `${name} в аренду`;
}

export function ProductCard({
  productId,
  name,
  slug,
  category,
  citySlug,
  images = [],
  pricePerDay,
  minDays,
  available,
  ownerPhone,
  isHideButton,
  pickupAddress,
  ratingBoost = 0,
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
  const productHref = getProductPath({ slug, category, citySlug });
  const isFeatured = ratingBoost > BOOST_HIGHLIGHT_THRESHOLD;
  const shortAddress = pickupAddress?.trim()
    ? pickupAddress.trim().length > 60
      ? `${pickupAddress.trim().slice(0, 60)}…`
      : pickupAddress.trim()
    : "";

  return (
    <>
      <article
        className={[
          "flex h-full flex-col overflow-hidden rounded-xl border bg-white text-black shadow-sm transition hover:shadow-md",
          isFeatured
            ? "product-card-premium border-amber-200/80 shadow-[0_12px_30px_-20px_rgba(245,158,11,0.6)]"
            : "border-black/5",
        ].join(" ")}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gray-50"
            aria-label={`Открыть изображение товара ${name}`}
          >
            <img
              src={selectedImage}
              alt={buildImageAlt(name)}
              className="relative z-[1] h-full w-full object-contain"
              loading="lazy"
            />
            <AvailabilityBadge available={available} />
          </button>
        </div>

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
                        alt={buildImageAlt(name, index)}
                        className="h-14 w-14 bg-gray-50 object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-14" />
            )}
          </div>

          <div className="min-h-[72px]">
            <h3 className="line-clamp-2 text-base font-medium leading-snug">
              <Link href={productHref} className="hover:text-zinc-700">
                {name}
              </Link>
            </h3>

            <div className="mt-2 space-y-1 text-sm text-zinc-500">
              <p>Минимум {minDays} дн.</p>
              {shortAddress ? <p className="line-clamp-2">{shortAddress}</p> : null}
            </div>
          </div>

          <div className="mt-3">
            <PriceBlock pricePerDay={pricePerDay} />
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            {!isHideButton && (
              <Button onClick={() => setIsBookingModalOpen(true)}>
                Арендовать
              </Button>
            )}

            <Link
              href={productHref}
              className="text-sm text-gray-500 hover:text-black"
              aria-label={`Открыть карточку товара ${name}`}
            >
              Подробнее
            </Link>
          </div>
        </div>
      </article>

      <Modal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        panelClassName="w-full max-w-6xl rounded-2xl bg-white p-4 shadow-xl sm:p-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex h-[75vh] items-center justify-center rounded-xl bg-black/5">
            <img
              src={selectedImage}
              alt={buildImageAlt(name, selectedIndex)}
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
                      alt={buildImageAlt(name, index)}
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
        panelClassName="max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-2xl bg-background p-4 shadow-xl sm:p-6"
      >
        <ProductBookingForm
          productId={productId}
          minDays={minDays}
          ownerPhone={ownerPhone}
          pickupAddress={pickupAddress}
        />
      </Modal>
    </>
  );
}