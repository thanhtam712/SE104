"use client";

import {
    MoreHorizontalIcon,
    DeleteIcon,
    EditIcon,
    MessageSquare, // Added icon
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from 'next/navigation';
import { useState } from "react"; // Import useState
import { RenameConversationModal } from "@/components/ui/RenameConversationModal"; // Import the modal
import { Endpoints } from "@/endpoints"; // Import Endpoints
import { getCookie } from "cookies-next";
import { toast } from "sonner";

interface NavChatHistoryProps {
    items: {
        id: string; // Add id to identify the conversation
        name: string;
        url: string;
    }[];
    onConversationDeleted: () => void; // Callback to refresh list after deletion
    onConversationRenamed: () => void; // Callback to refresh list after rename
}

export function NavChatHistory({ items, onConversationRenamed, onConversationDeleted }: NavChatHistoryProps) {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<{ id: string; name: string } | null>(null);

    const handleNavigation = (url: string) => {
        router.push(`/chat/${url}`);
    };

    const openRenameModal = (id: string, name: string) => {
        setSelectedConversation({ id, name });
        setIsRenameModalOpen(true);
    };

    const handleSaveTitle = async (newTitle: string) => {
        if (!selectedConversation) return;

        const refreshToken = getCookie("refresh_token");
        if (!refreshToken) {
            toast.error("Authentication token not found. Please log in again.");
            return;
        }

        try {
            const response = await fetch(Endpoints.updateConversationTitle(selectedConversation.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`,
                },
                body: JSON.stringify({ title: newTitle }),
            });

            if (response.ok) {
                toast.success("Conversation renamed successfully.");
                setIsRenameModalOpen(false);
                setSelectedConversation(null);
                onConversationRenamed(); // Call the callback to refresh the list
            } else {
                const errorData = await response.json();
                toast.error(`Failed to rename conversation: ${errorData.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error renaming conversation:", error);
            toast.error("An error occurred while renaming the conversation.");
        }
    };

    const handleDeleteConversation = async (conversationId: string) => {
        if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
            return;
        }

        const refreshToken = getCookie("refresh_token");
        if (!refreshToken) {
            toast.error("Authentication token not found. Please log in again.");
            return;
        }

        try {
            const response = await fetch(Endpoints.deleteConversation(conversationId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${refreshToken}`,
                },
            });

            if (response.ok) {
                toast.success("Conversation deleted successfully.");
                onConversationDeleted(); // Call the callback to refresh the list
                // Optionally, navigate away if the deleted conversation was active
                // router.push('/chat/new'); 
            } else {
                const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
                toast.error(`Failed to delete conversation: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
            toast.error("An error occurred while deleting the conversation.");
        }
    };


    return (
        <>
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                <SidebarMenu>
                    {items.map(({ id, name, url }) => ( // Destructure id
                        <SidebarMenuItem key={url} className="cursor-pointer group hover:bg-accent/50 rounded-md">
                            <SidebarMenuButton
                                onClick={() => handleNavigation(url)}
                                className="cursor-pointer group-hover:text-accent-foreground"
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span>{name}</span>
                            </SidebarMenuButton>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild className="cursor-pointer">
                                    <SidebarMenuAction
                                        showOnHover
                                        className="rounded-sm data-[state=open]:bg-accent group-hover:opacity-100 opacity-0 transition-opacity duration-200"
                                    >
                                        <MoreHorizontalIcon />
                                        <span className="sr-only">More</span>
                                    </SidebarMenuAction>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-24 rounded-lg cursor-pointer"
                                    side={isMobile ? "bottom" : "right"}
                                    align={isMobile ? "end" : "start"}
                                >
                                    <DropdownMenuItem className="hover:bg-accent/80 cursor-pointer" onClick={() => openRenameModal(id, name)}>
                                        <EditIcon className="mr-2 h-4 w-4 text-green-500" />
                                        <span>Rename</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer hover:bg-accent/80 text-red-500 hover:text-red-600" onClick={() => handleDeleteConversation(id)}>
                                        <DeleteIcon className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
            {selectedConversation && (
                <RenameConversationModal
                    open={isRenameModalOpen}
                    onClose={() => {
                        setIsRenameModalOpen(false);
                        setSelectedConversation(null);
                    }}
                    onSave={handleSaveTitle}
                    currentTitle={selectedConversation.name}
                />
            )}
        </>
    );
}

