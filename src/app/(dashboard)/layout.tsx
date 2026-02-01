import { AppShell } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";

// Force dynamic rendering for the dashboard
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <Toaster />
    </>
  );
}
