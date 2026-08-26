import { redirect } from "next/navigation";

export default function FinanceOverviewRedirect() {
  redirect("/dashboard/finance-dashboard");
}
