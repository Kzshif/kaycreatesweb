import Dashboard from "@/components/Dashboard";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata = {
  title: "Dashboard · nova05",
};

export default function DashboardPage() {
  return (
    <>
      <SiteHeader active="dashboard" />
      <main className="container-x py-10">
        <Dashboard />
      </main>
      <SiteFooter />
    </>
  );
}
