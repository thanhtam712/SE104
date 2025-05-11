"use client"

import { ReactNode, useEffect } from "react"
import { AppSidebar } from "@/components/DashBoard/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { toast, ToastContainer } from "react-toastify"
import ClientSideToastContainer from "@/components/toast/toast"

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Chat application" />
                <link rel="icon" href="/favicon.ico" />
                <title>Chat Application</title>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" />
            </head>
            <body>
                <SidebarProvider>
                    <AppSidebar variant="inset" />

                    <div className="ml-[--sidebar-width] min-h-screen w-full">
                        {children}
                    </div>

                    {/* <ToastContainer position="bottom-right" /> */}
                    <ClientSideToastContainer />
                </SidebarProvider>
            </body>
        </html>
    )
}
