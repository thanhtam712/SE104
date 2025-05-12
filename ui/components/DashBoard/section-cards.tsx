import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Endpoints } from "@/endpoints"
import { getCookie } from "cookies-next"
import { TrendingUpIcon, UsersIcon, MessagesSquareIcon, PercentIcon } from "lucide-react" // Removed ActivityIcon as it's no longer used here
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AdminApiResponse, AdminStatsData } from "@/types"; // Import AdminApiResponse and AdminStatsData

// Removed local AdminStatsData and AdminApiResponse interfaces as they are now imported

export function SectionCards() {
    const [stats, setStats] = useState<AdminStatsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true)
            try {
                const refreshToken = getCookie("refresh_token")
                const response = await fetch(Endpoints.getAdminStats, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${refreshToken}`,
                    },
                })
                const result: AdminApiResponse = await response.json() // Use AdminApiResponse type

                if (response.ok && result.status === "success") {
                    setStats(result.data) // Set stats to result.data
                } else {
                    toast.error(`Failed to fetch admin stats: ${result.message || "Unknown error"}`)
                    setStats({ num_users: 0, num_conversations: 0, recent_conversations: [] }) // Default/fallback stats
                }
            } catch (error) {
                console.error("Error fetching admin stats:", error)
                toast.error("An error occurred while fetching admin statistics.")
                setStats({ num_users: 0, num_conversations: 0, recent_conversations: [] }) // Default/fallback stats
            }
            setLoading(false)
        }

        fetchStats()
    }, [])

    return (
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
            {/* Card 1: Total Users */}
            <Card className="@container/card">
                <CardHeader className="relative">
                    <CardDescription>Total Users</CardDescription>
                    <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                        {loading ? "..." : stats?.num_users ?? "N/A"}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        <UsersIcon className="size-4 text-muted-foreground" />
                        Growing user base
                    </div>
                    <div className="text-muted-foreground">
                        Registered users count
                    </div>
                </CardFooter>
            </Card>

            {/* Card 2: Total Conversations */}
            <Card className="@container/card">
                <CardHeader className="relative">
                    <CardDescription>Total Conversations</CardDescription>
                    <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                        {loading ? "..." : stats?.num_conversations ?? "N/A"}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        <MessagesSquareIcon className="size-4 text-muted-foreground" />
                        User engagement
                    </div>
                    <div className="text-muted-foreground">
                        Total conversations started
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
