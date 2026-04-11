"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";

type Props = {
  name: string;
  images?: string[];
};

const FALLBACK_IMAGE = "/assets/no-image.webp";

function buildImageAlt(name: string, index?: number) {
  if (typeof index === "number") {
    return `${name} в аренду — фото ${index + 1}`;
  }

  return `${name} в аренду — основное фото`;
}

export function ProductGallery({ name, images = [] }: Props) {
  const normalizedImages = useMemo(() => {
    const filtered = images.filter(Boolean);
    return filtered.length > 0 ? filtered : [FALLBACK_IMAGE];
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const effectSelect = useEffectEvent(() => setSelectedIndex(0));

  useEffect(() => {
    effectSelect();
  }, [images]);

  const selectedImage = normalizedImages[selectedIndex] ?? FALLBACK_IMAGE;
  const showThumbnails = normalizedImages.length > 1;

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-zinc-50"
          aria-label={`Открыть изображение товара ${name}`}
        >
          <img
            src={selectedImage}
            alt={buildImageAlt(name)}
            className="max-h-[420px] w-full object-contain"
          />
        </button>

        {showThumbnails ? (
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1">
            {normalizedImages.map((image, index) => {
              const isActive = index === selectedIndex;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={[
                    "shrink-0 overflow-hidden rounded-lg border bg-white transition",
                    isActive
                      ? "border-black ring-2 ring-black/15"
                      : "border-border-subtle hover:border-zinc-300",
                  ].join(" ")}
                  aria-label={`Показать изображение ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={buildImageAlt(name, index)}
                    className="h-20 w-20 object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="w-full max-w-6xl rounded-2xl bg-white p-4 shadow-xl sm:p-6"
      >
        <div className="space-y-4">
          <div className="flex h-[75vh] items-center justify-center rounded-xl bg-zinc-50">
            <img
              src={selectedImage}
              alt={buildImageAlt(name, selectedIndex)}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {showThumbnails ? (
            <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1">
              {normalizedImages.map((image, index) => {
                const isActive = index === selectedIndex;

                return (
                  <button
                    key={`modal-${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={[
                      "shrink-0 overflow-hidden rounded-lg border bg-white transition",
                      isActive
                        ? "border-black ring-2 ring-black/15"
                        : "border-border-subtle hover:border-zinc-300",
                    ].join(" ")}
                    aria-label={`Показать изображение ${index + 1} в модальном окне`}
                  >
                    <img
                      src={image}
                      alt={buildImageAlt(name, index)}
                      className="h-20 w-20 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}