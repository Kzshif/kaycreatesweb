import { getUser } from "@/lib/auth";
import Overview from "@/components/Overview";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await getUser();
  return <Overview firstName={user?.name.split(" ")[0] ?? "there"} />;
}
