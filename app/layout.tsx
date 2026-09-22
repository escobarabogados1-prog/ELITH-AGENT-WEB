import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElithLex Agent · ELITH IA LEGAL TECH",
  description:
    "Asistente jurídico y comercial de ELITH IA LEGAL TECH. Cuéntanos qué necesitas resolver.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-navy-900 text-white antialiased">{children}</body>
    </html>
  );
}
