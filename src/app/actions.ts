"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteScan(scanId: string) {
  console.log("[deleteScan] Starting delete for scan:", scanId);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[deleteScan] No user found");
    throw new Error("Unauthorized");
  }

  console.log(
    "[deleteScan] User:",
    user.id,
    "attempting to delete scan:",
    scanId,
  );

  const { error } = await supabase
    .from("scans")
    .delete()
    .eq("id", scanId)
    .eq("user_id", user.id); // Ensure user owns the scan

  if (error) {
    console.error("[deleteScan] Delete failed:", error);
    throw new Error(`Failed to delete scan: ${error.message}`);
  }

  console.log("[deleteScan] Delete successful, revalidating path");
  revalidatePath("/dashboard");
}
