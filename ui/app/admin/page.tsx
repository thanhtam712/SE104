"use client"
import { AppSidebar } from "@/components/DashBoard/app-sidebar"
import { ChartAreaInteractive } from "@/components/DashBoard/chart-area-interactive"
import { DataTable } from "@/components/DashBoard/data-table"
import { SectionCards } from "@/components/DashBoard/section-cards"
import { SiteHeader } from "@/components/DashBoard/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from "react"
import { toast } from "react-toastify"

export default function PageAdmin() {
    return (
        <>
            {/* <SiteHeader /> */}
            {/* <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6">
                            <ChartAreaInteractive />
                        </div>
                        <DataTable data={data} />
                    </div>
                </div>
            </div> */}
        </>
    )
}
