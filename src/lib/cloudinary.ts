import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "s50agdwv",
  api_key: process.env.CLOUDINARY_API_KEY || "526325542843859",
  api_secret: process.env.CLOUDINARY_API_SECRET || "uA_XjPfqHcI-lUzNMEM-NdLPPQo",
  secure: true,
});

export { cloudinary };

/**
 * Upload buffer ảnh lên Cloudinary sử dụng upload_preset
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename?: string,
  folder = "trasua-dino"
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "s50agdwv";
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET || "dino_preset";

  // Sử dụng HTTPS Direct POST với upload_preset
  const base64Data = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const postData = JSON.stringify({
    file: base64Data,
    upload_preset: preset,
    folder,
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: postData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    secureUrl: data.secure_url || data.url,
  };
}
