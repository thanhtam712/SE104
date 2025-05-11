"use client"

import { AuthProvider } from "@/hooks/auth";
import { ToastContainer } from 'react-toastify';
import "../globals.css";
import { UserChatProvider } from "@/hooks/userChat";

export default function UserChatLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <UserChatProvider>
            <AuthProvider>
                {children}
                <ToastContainer />
            </AuthProvider>
        </UserChatProvider>
    )
}
