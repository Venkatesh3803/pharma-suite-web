import { TooltipProvider } from "@/components/ui/tooltip";
import ReduxProvider from "@/components/providers/redux-provider";
import "./globals.css";

export const metadata = {
  title: "PharmaSuite",
  description: "Retail Store POS",
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
        </ReduxProvider>
      </body>
    </html>
  );
}
