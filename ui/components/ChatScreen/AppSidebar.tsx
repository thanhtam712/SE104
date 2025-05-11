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
import { useUserChat } from "@/hooks/userChat"
import { Conversation } from "@/types"

import { CreateNewChat } from "@/components/ChatScreen/create-new-chat"
import { SearchChatHistory } from "@/components/ChatScreen/search-chat-history"

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
    const [chats, setChats] = React.useState<Conversation[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
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
        fetchChats();
    }, [listConversations]);

    // You can keep the user info static or fetch from context if needed
    const user = {
        name: "ttam",
        email: "ttam712@gmail.com",
        avatar: "/avatars/shadcn.jpg",
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
                                className="focus:outline-none focus:ring-0 focus:ring-offset-0"
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
                                className="focus:outline-none focus:ring-0 focus:ring-offset-0"
                            >
                                <SidebarIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Chat History */}
            <SidebarContent className="p-4">
                <SidebarGroup>
                    <SidebarGroupLabel
                        className={`text-sm font-medium text-gray-600 ${isSidebarCollapsed ? "hidden" : ""
                            }`}
                    >
                        History
                    </SidebarGroupLabel>
                    <SidebarContent className={`mt-2 ${isSidebarCollapsed ? "hidden" : ""}`}>
                        {/* Pass fetched chats to NavChatHistory */}
                        <NavChatHistory items={chats.map(chat => ({
                            name: chat.title || "Untitled Chat",
                            url: `${chat.id}`,
                        }))} />
                    </SidebarContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter
                className={`p-4 border-t border-gray-200 ${isSidebarCollapsed ? "hidden" : ""}`}
            >
                <NavUser user={user} />
            </SidebarFooter>

            {/* Sidebar Rail */}
            {/* <SidebarRail /> */}
        </Sidebar>
    )
}
