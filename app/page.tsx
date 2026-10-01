import { redirect } from "next/navigation";

// Root URL (`/`) has no page of its own. Send everyone to the default
// landing page and let `proxy.ts` bounce unauthenticated visitors to
// `/sign-in` (it appends `?next=/...` for a post-login return).
export default function RootPage() {
  redirect("/dashboard/purchase-dashboard");
}
