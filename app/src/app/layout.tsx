import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Väntetid — öppen översikt över svensk vård",
  description:
    "Sammanställd öppen data om väntetider i svensk vård. Uppdateras automatiskt. Varje siffra spårbar till sin källa.",
  metadataBase: new URL("https://vantetid.se"),
  openGraph: {
    title: "Väntetid — öppen översikt över svensk vård",
    description:
      "Öppen, verifierbar översikt över väntetider i vården. Uppdateras automatiskt från Kolada, Socialstyrelsen och SKR.",
    locale: "sv_SE",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
