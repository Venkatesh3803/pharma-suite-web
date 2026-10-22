import type { Metadata, Viewport } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReduxProvider from "@/components/providers/redux-provider";
import PwaProvider from "@/components/providers/pwa-provider";
import InstallPrompt from "@/components/common/install-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PharmaSuite",
    template: "%s · PharmaSuite",
  },
  description: "Retail pharmacy POS, inventory, purchasing and finance management.",
  applicationName: "PharmaSuite",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PharmaSuite",
  },
  formatDetection: {
    telephone: false,
  },
  // Next emits the standardized `mobile-web-app-capable`; iOS still checks
  // the Apple-prefixed variant for full-screen standalone mode.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e3b36",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-paper text-ink">
        <ReduxProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          <PwaProvider />
          <InstallPrompt />
        </ReduxProvider>
      </body>
    </html>
  );
}
