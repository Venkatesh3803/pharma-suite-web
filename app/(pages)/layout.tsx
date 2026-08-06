import AppSidebar from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AppSidebar>{children}</AppSidebar>
    </div>
  );
}
