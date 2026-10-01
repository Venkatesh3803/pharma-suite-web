import { redirect } from "next/navigation";

// `/finance` is a section parent with no page of its own — land on overview.
export default function FinanceIndexPage() {
  redirect("/finance/overview");
}
