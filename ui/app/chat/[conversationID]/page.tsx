"use client"
import { AppSidebar } from "@/components/ChatScreen/AppSidebar";
import { Conversation } from "@/components/ChatScreen/Conversation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserChatProvider } from "@/hooks/userChat";
import { useState } from "react";

export default function PageUser() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    return (
        <UserChatProvider>
            <SidebarProvider>
                <div className="flex h-screen w-full">
                    <AppSidebar setIsSidebarCollapsed={setIsSidebarCollapsed} isSidebarCollapsed={isSidebarCollapsed} />
                    <Conversation isSidebarCollapsed={isSidebarCollapsed} />
                </div>
            </SidebarProvider>
        </UserChatProvider>
    )
}
