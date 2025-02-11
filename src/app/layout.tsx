import {ClerkProvider, SignIn} from '@clerk/nextjs'
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";

const IBM_PLEX = IBM_Plex_Sans({
  weight: ['400','500','600','700'],
  variable: '--font-ibm-plex',
  subsets: ["latin"],
});

export const metadata = {
  title: "Imaginify",
  description: "AI-powered image generator",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={
      {
        variables: {colorPrimary: '#624cf5'}
      }
    }>
    <html lang="en">
      <body
        className={cn('font-IBM_PLEX antialiased', IBM_PLEX.variable)}
      >
        {children}
      </body>
    </html>
    </ClerkProvider>
  );
}
