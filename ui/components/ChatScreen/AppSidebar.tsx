"use client"

import { NavChatHistory } from "@/components/ChatScreen/nav-chat-history"
import { NavUser } from "@/components/ChatScreen/user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { SidebarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { toast } from "react-toastify"
import { useState, useEffect } from "react"
import { useUserChat } from "@/hooks/userChat"
import { Conversation } from "@/types"
import { authApi } from "@/api/auth"
import { getCookie } from "cookies-next"
import { InUser } from "@/types"

import { CreateNewChat } from "@/components/ChatScreen/create-new-chat"
import { SearchChatHistory } from "@/components/ChatScreen/search-chat-history"
import { useRouter } from "next/navigation"

interface AppSidebarProps {
    setIsSidebarCollapsed: (isCollapsed: boolean) => void
    isSidebarCollapsed: boolean
}

export function AppSidebar({ setIsSidebarCollapsed, isSidebarCollapsed, ...props }: AppSidebarProps) {
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed)
    }
    // Fetch chat history from backend
    const { listConversations } = useUserChat();
    const [refresh_token, setRefreshToken] = useState("")
    const [user, setUser] = useState<InUser | null>(null);
    const [chats, setChats] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchChats = async () => {
        setLoading(true);
        try {
            const res = await listConversations();
            setChats(res.conversations || []);
        } catch (e) {
            setChats([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchChats();
    }, [listConversations]);

    // You can keep the user info static or fetch from context if needed
    // useEffect(() => {
    //     const fetchUser = async () => {
    //         const refresh_token = getCookie("refresh_token");

    //         if (!refresh_token) {
    //             console.error("No refresh token found in avt");
    //             return;
    //         }

    //         setRefreshToken(refresh_token.toString());
    //         const userInfo: InUser = await authApi.me(refresh_token.toString());
    //         if (!userInfo) {
    //             console.error("No user info found");
    //             return;
    //         }
    //         setUser(userInfo);
    //     }
    //     fetchUser();
    // }, [])

    // const dataUser = {
    //     name: user?.name,
    //     email: user?.email,
    //     avatar: "./chatbot_admission_logo.png",
    // }
    useEffect(() => {
        const fetchUser = async () => {
            const refresh_token = getCookie("refresh_token");
            if (!refresh_token) {
                return;
            }

            setRefreshToken(refresh_token.toString());
            try {
                const userInfo: InUser = await authApi.me(refresh_token.toString());
                if (userInfo) {
                    setUser(userInfo);
                } else {
                    toast.error("No user info found");
                    setUser(null); // Ensure user is null in case of failure
                }
            } catch (error) {
                toast.error("Error fetching user info");
                setUser(null); // Handle API error
            }
        }
        fetchUser();
    }, [])

    // Create dataUser only when user data is available
    const dataUser = user
        ? {
            name: user.name,
            email: user.email,
            avatar: "./chatbot_admission_logo.png",
        }
        : {
            name: "Loading...", // Or some default/loading state
            email: "",
            avatar: "./chatbot_admission_logo.png",
        };

    return (
        <Sidebar
            collapsible="icon"
            {...props}
            className={`bg-gray-50 shadow-md ${isSidebarCollapsed ? "w-16" : "w-64"}`}
        >
            <div
                className={`p-4 flex bg-gray-50 justify-end items-center shadow-inner transition-all duration-300 ${!isSidebarCollapsed ? 'flex-row space-x-4 p-4 justify-center' : 'flex flex-col-reverse space-y-4 space-y-reverse p-2'
                    }`}
            >
                {/* Reverse icon when Sidebar closed */}
                {!isSidebarCollapsed ? (
                    <>
                        <SearchChatHistory aria-label="Search Chat History" />
                        <CreateNewChat aria-label="Create New Chat" />
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                onClick={toggleSidebar}
                                size="icon"
                                aria-label="Toggle Sidebar"
                                className="focus:outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            >
                                <SidebarIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <SearchChatHistory aria-label="Search Chat History" />
                        <CreateNewChat aria-label="Create New Chat" />
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                onClick={toggleSidebar}
                                size="icon"
                                aria-label="Toggle Sidebar"
                                className="focus:outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            >
                                <SidebarIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <SidebarContent className="flex-1 overflow-y-auto">
                <NavChatHistory
                    items={chats.map(chat => ({ id: chat.id, name: chat.title, url: chat.id }))}
                    onConversationRenamed={fetchChats} // Pass fetchChats as callback
                    onConversationDeleted={fetchChats} // Pass fetchChats as callback for deletion as well
                />
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter
                className={`p-4 border-t border-gray-200 ${isSidebarCollapsed ? "hidden" : ""}`}
            >
                <NavUser user={dataUser} />
            </SidebarFooter>

            {/* Sidebar Rail */}
            {/* <SidebarRail /> */}
        </Sidebar>
    )
}
