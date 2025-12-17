import { supabase } from "../lib/supabase";

const BUCKET_NAME = "viral-boost-assets";

export const uploadMedia = async (file) => {
  if (!supabase) throw new Error("Supabase client not initialized");

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (error) {
    console.error("Error uploading file:", error);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return publicUrl;
};
