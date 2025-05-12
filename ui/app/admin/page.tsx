"use client"
import { ChartAreaInteractive } from "@/components/DashBoard/chart-area-interactive"
import { DataTable } from "@/components/DashBoard/data-table"
import { SectionCards } from "@/components/DashBoard/section-cards"
import { SiteHeader } from "@/components/DashBoard/site-header"
import { Endpoints } from "@/endpoints"
import { AdminApiResponse, RecentConversation } from "@/types"
import { getCookie } from "cookies-next"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function PageAdmin() {
    const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            setLoadingStats(true);
            try {
                const refreshToken = getCookie("refresh_token");
                const response = await fetch(Endpoints.getAdminStats, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${refreshToken}`,
                    },
                });
                const result: AdminApiResponse = await response.json();

                if (response.ok && result.status === "success") {
                    setRecentConversations(result.data.recent_conversations || []);
                } else {
                    toast.error(`Failed to fetch admin stats: ${result.message || "Unknown error"}`);
                    setRecentConversations([]);
                }
            } catch (error) {
                console.error("Error fetching admin stats:", error);
                toast.error("An error occurred while fetching admin statistics.");
                setRecentConversations([]);
            }
            setLoadingStats(false);
        };

        fetchAdminData();
    }, []);

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards /> {/* SectionCards will fetch its own data now */}
                        {/* <div className="px-4 lg:px-6">
                            <ChartAreaInteractive />
                        </div> */}
                        <div className="px-4 lg:px-6">
                            <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
                            {loadingStats ? (
                                <p>Loading recent conversations...</p>
                            ) : (
                                <DataTable data={recentConversations} dataType="recentConversations" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
