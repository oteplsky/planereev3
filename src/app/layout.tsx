import type { Metadata } from "next";
import { Montserrat_Alternates } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { StoreHydrator } from "@/components/StoreGate";
import "./globals.css";

const montserratAlternates = Montserrat_Alternates({
  variable: "--font-montserrat-alternates",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Planeree — Библиотека",
  description: "Прототип библиотеки материалов Planeree",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${montserratAlternates.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <StoreHydrator />
        <AppHeader />
        <main className="mx-auto w-full max-w-[1264px] flex-1 px-8 pt-8 pb-16">{children}</main>
      </body>
    </html>
  );
}
