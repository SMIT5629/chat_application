import ImageKit from "imagekit";
import { Buffer } from "node:buffer";

export interface UploadResult {
    url: string;
    fileId: string;
    name?: string;
    thumbnailUrl?: string;
}

let imagekitClient: ImageKit | null = null;

function getImageKitClient(): ImageKit | null {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
        return null;
    }

    if (!imagekitClient) {
        imagekitClient = new ImageKit({
            publicKey,
            privateKey,
            urlEndpoint,
        });
    }

    return imagekitClient;
}

export async function uploadFile(
    buffer: Buffer,
    fileName: string = `upload_${Date.now()}.jpg`,
    folder: string = "/chat_attachments",
    mimeType: string = "image/jpeg"
): Promise<UploadResult> {
    const client = getImageKitClient();

    if (client) {
        try {
            const result = await client.upload({
                file: buffer.toString("base64"),
                fileName,
                folder,
                useUniqueFileName: true,
            });

            return {
                url: result.url,
                fileId: result.fileId,
                name: result.name,
                thumbnailUrl: result.thumbnailUrl,
            };
        } catch (error) {
            console.error("ImageKit upload error:", error);
            throw new Error("Failed to upload file to ImageKit storage");
        }
    }

    // Fallback: If ImageKit credentials are not configured, return base64 Data URL for local dev
    console.warn(
        "ImageKit environment variables are not configured. Returning data URL fallback."
    );
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return {
        url: dataUrl,
        fileId: `local_${Date.now()}`,
        name: fileName,
    };
}

export default uploadFile;
