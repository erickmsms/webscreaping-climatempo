import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Climatempo Forecast Quality",
  description: "Qualidade da previsão do Climatempo: previsão de D-1 comparada com o dado de D.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
