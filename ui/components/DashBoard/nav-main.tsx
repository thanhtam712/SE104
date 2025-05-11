"use client"

import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useRouter } from "next/navigation"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
    }[]
}) {
    const router = useRouter()

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title} className="cursor-pointer">
                            <SidebarMenuButton className="cursor-pointer" tooltip={item.title} onClick={() => {
                                router.push(item.url)
                            }}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
