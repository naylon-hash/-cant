// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "$CANT",
  description: "I can’t. We can’t. You can’t.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Expose community URL at runtime for the client helper */}
        {process.env.NEXT_PUBLIC_COMMUNITY_URL ? (
          <meta
            name="community-url"
            content={process.env.NEXT_PUBLIC_COMMUNITY_URL}
          />
        ) : null}
      </head>
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
