import "../styles/globals.css";
import { headers } from "next/headers";
import Fathom from "@/components/Fathom/Fathom";
// import ProgressBar from "@/components/ProgressBar/ProgressBar";
import ThemeProvider from "@/components/Theme/ThemeProvider";
import { TRPCReactProvider } from "@/server/trpc/react";
import Footer from "@/components/Footer/Footer";
import Nav from "@/components/Nav/Nav";
import { getServerAuthSession } from "@/server/auth";
import AuthProvider from "@/context/AuthProvider";
// @TODO layout app in way that doesn't need to use client session check
import NextTopLoader from "nextjs-toploader";
export const metadata = {
  title: "Codú - The Web Developer Community",
  description:
    "A free network and community for web developers. Learn and grow together.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  publisher: "Codú",
  applicationName: "Codú",
  metadataBase: new URL("https://www.codu.co"),
  openGraph: {
    images: "/images/og/home-og.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  return (
    <html lang="en" className="h-full">
      {/* <ProgressBar />  Needs to be fixed */}
      <Fathom />
      <body className="h-full" suppressHydrationWarning={true}>
        <NextTopLoader
          showSpinner={false}
          template='<div class="bar" role="bar"><div class="gradient"></div></div>'
        />
        <AuthProvider>
          <ThemeProvider>
            <TRPCReactProvider headers={headers()}>
              <Nav session={session} />
              {children}
              <Footer />
            </TRPCReactProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
