"use client"

import { AuthProvider } from "@/hooks/auth";
import { toast, ToastContainer } from 'react-toastify';
import "./globals.css";
import { UserChatProvider } from "@/hooks/userChat";
import { useEffect } from "react";
import { Endpoints } from "@/endpoints";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import { Playfair_Display } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700']
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    // Skip session check for public routes
    if (pathname === "/auth/login" || pathname === "/auth/signup") return;
    (async () => {
      const refreshToken = getCookie("refresh_token");
      const response = await fetch(Endpoints.me, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${refreshToken}`,
        }
      })

      if (!response.ok) {
        toast.error("Session expired. Please log in again.");
        router.push("/auth/login");
        return;
      }

      const data = await response.json();
      if (data.status !== "success") {
        toast.error("Session expired. Please log in again.");
        router.push("/auth/login");
        return;
      }
    })();
  }, [pathname]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Chat application" />
        <link rel="icon" href="/favicon.ico" />
        <title>Chat Application</title>
      </head>

      <body>
        <UserChatProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </UserChatProvider>

        <ToastContainer />
      </body>
    </html >
  )
}
