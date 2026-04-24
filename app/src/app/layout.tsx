import type { Metadata } from "next";
import "./globals.css";

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
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&f[]=cabinet-grotesk@500,700,800,900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
