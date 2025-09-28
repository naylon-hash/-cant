import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$CANT — I can’t. We can’t. You can’t.",
  description: "Share your CANT, get a CAN. $CANT",
  openGraph: {
    title: "$CANT — I can’t. We can’t. You can’t.",
    description: "Share your CANT, get a CAN. $CANT",
    images: [{ url: "/api/og" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "$CANT — I can’t. We can’t. You can’t.",
    description: "Share your CANT, get a CAN. $CANT",
    images: ["/api/og"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="community-url" content={process.env.NEXT_PUBLIC_COMMUNITY_URL || ""} />
      </head>
      <body>{children}</body>
    </html>
  );
}
