"use client"

import {
    LayoutDashboardIcon,
    UserIcon,
    SettingsIcon
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/DashBoard/nav-main"
import { NavUser } from "@/components/DashBoard/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/admin", // Updated to link to the admin dashboard
            icon: LayoutDashboardIcon,
        },
        {
            title: "Users", // Changed from "User" to "Users" for clarity
            url: "/admin/user", // Updated to link to the user management page
            icon: UserIcon,
        },
        {
            title: "Settings",
            url: "#",
            icon: SettingsIcon,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <a href="#">
                                {/* <ArrowUpCircleIcon className="h-5 w-5" /> */}
                                <span className="text-base font-semibold">Admission Chatbot</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            {/* <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter> */}
        </Sidebar>
    )
}
