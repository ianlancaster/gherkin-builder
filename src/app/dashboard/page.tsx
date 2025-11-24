import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: scans } = await supabase
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false });

  return <DashboardClient scans={scans} />;
}
