import { redirect } from "next/navigation";

// `/purchase` is a section parent with no page of its own — land on orders.
export default function PurchaseIndexPage() {
  redirect("/purchase/order");
}
