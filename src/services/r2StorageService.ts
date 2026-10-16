import { supabase } from "../lib/supabase";

type UploadFolder =
  | "products"
  | "categories"
  | "employees"
  | "receipts"
  | "store"
  | "reports";

type UploadResult = {
  objectKey: string;
  fileUrl: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const r2StorageService = {
  async upload(
    file: File,
    folder: UploadFolder,
  ): Promise<UploadResult> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File must be smaller than 5 MB");
    }

    const { data, error } = await supabase.functions.invoke(
      "r2-upload-url",
      {
        body: {
          fileName: file.name,
          contentType: file.type,
          folder,
        },
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.uploadUrl || !data?.objectKey) {
      throw new Error(data?.error || "Invalid upload response");
    }

    const uploadResponse = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`R2 upload failed: ${uploadResponse.status}`);
    }

    return {
      objectKey: data.objectKey,
      fileUrl: data.fileUrl,
    };
  },
};