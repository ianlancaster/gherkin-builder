import { createClient } from "@/utils/supabase/server";
import { Container } from "@mantine/core";
import { redirect } from "next/navigation";
import ScanResultsClient from "./ScanResultsClient";

export default async function ScanResults({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: scan } = await supabase
    .from("scans")
    .select("*, features(*)")
    .eq("id", id)
    .single();

  if (!scan) {
    return <Container>Scan not found</Container>;
  }

  return <ScanResultsClient scan={scan} />;
}
