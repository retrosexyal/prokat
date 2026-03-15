import { v2 as cloudinary } from "cloudinary";

// Конфигурация берётся из CLOUDINARY_URL в .env.local
cloudinary.config({
  secure: true,
});

export { cloudinary };

