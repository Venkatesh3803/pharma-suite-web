import { redirect } from "next/navigation";

// `/dashboard` has no overview of its own — land on the purchase dashboard.
export default function DashboardIndexPage() {
  redirect("/dashboard/purchase-dashboard");
}
