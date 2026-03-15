export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        };

        image.onerror = () => {
          reject(new Error("Не удалось прочитать изображение"));
        };

        image.src = objectUrl;
      },
    );

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function validateImageFile(file: File): Promise<string | null> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Разрешены только JPG, PNG и WEBP";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Максимальный размер файла: ${MAX_IMAGE_SIZE_MB} MB`;
  }

  const { width, height } = await getImageDimensions(file);

  if (width < 300 || height < 300) {
    return "Минимальный размер изображения: 300x300";
  }

  return null;
}