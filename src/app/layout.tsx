import type { Metadata } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteIntro } from "@/components/brand/site-intro";
import { AutoTranslate } from "@/components/providers/auto-translate";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { siteConfig } from "@/config/site";
import { platformSettingsService } from "@/server/application/settings/settings.service";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  await headers();
  const settings = await platformSettingsService.getSettings();
  return {
    title: `${settings.siteName || siteConfig.name} — ${siteConfig.tagline}`,
    description: settings.siteDescription || siteConfig.description,
    icons: {
      icon: settings.faviconUrl || "/favicon.ico",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased transition-colors duration-200">
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <SiteIntro />
              <AutoTranslate />
              <Header />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
