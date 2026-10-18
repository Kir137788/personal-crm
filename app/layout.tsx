import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Круг — личная CRM", description: "Люди и контекст, который хочется сохранить" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ru"><body>{children}</body></html>; }
