import { TooltipProvider } from "@/components/ui/tooltip";
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
      <body className="antialiased bg-slate-50 text-slate-900">
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
