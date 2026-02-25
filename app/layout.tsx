import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wise — AI Creative Director",
  description: "AI-powered creative briefs for any brand. Describe a product and get a full strategic creative brief instantly.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var saved = localStorage.getItem('wise-theme');
                var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', saved || preferred);
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body className={inter.variable} style={{ fontFamily: "'Inter', sans-serif" }}>
        <ThemeProvider>
          <a href="#main-content" className="sr-only">Skip to main content</a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}