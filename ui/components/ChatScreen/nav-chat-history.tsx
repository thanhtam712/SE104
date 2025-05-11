"use client";

import {
    MoreHorizontalIcon,
    DeleteIcon,
    EditIcon,
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

interface NavChatHistoryProps {
    items: {
        name: string;
        url: string;
    }[];
}

export function NavChatHistory({ items }: NavChatHistoryProps) {
    const { isMobile } = useSidebar();
    const router = useRouter();

    const handleNavigation = (url: string) => {
        router.push(`/chat/${url}`);
    };

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                {items.map(({ name, url }) => (
                    <SidebarMenuItem key={name} className="cursor-pointer">
                        <SidebarMenuButton onClick={() => handleNavigation(url)} className="cursor-pointer">
                            <span>{name}</span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction
                                    showOnHover
                                    className="rounded-sm data-[state=open]:bg-accent"
                                >
                                    <MoreHorizontalIcon />
                                    <span className="sr-only">More</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-24 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align={isMobile ? "end" : "start"}
                            >
                                <DropdownMenuItem>
                                    <EditIcon color="green" />
                                    <span>Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <DeleteIcon color="red" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
