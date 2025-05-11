import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Calculator,
    Calendar,
    Smile,
    Search
} from "lucide-react"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

import { useRouter } from "next/navigation"
import { useUserChat } from "@/hooks/userChat"; // Import useUserChat
import { Conversation } from "@/types"; // Import Conversation type

export function SearchChatHistory() {
    const [open, setOpen] = React.useState(false)
    const { listConversations } = useUserChat(); // Use the hook
    const [chats, setChats] = React.useState<Conversation[]>([]); // State for chats
    const [loading, setLoading] = React.useState(true); // State for loading

    // Fetch conversations when the dialog opens or listConversations changes
    React.useEffect(() => {
        if (open) {
            const fetchChats = async () => {
                setLoading(true);
                try {
                    const res = await listConversations();
                    setChats(res.conversations || []);
                } catch (e) {
                    console.error("Failed to fetch conversations for search:", e);
                    setChats([]);
                }
                setLoading(false);
            };
            fetchChats();
        }
    }, [open, listConversations]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Search chat history"
                    className="focus:outline-none focus:ring-0 focus:ring-offset-0 p-4"
                >
                    <Search className="h-32 w-32" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Search chat history</DialogTitle>
                </DialogHeader>
                <CommandDemo setDialogOpen={setOpen} chats={chats} loading={loading} />
            </DialogContent>
        </Dialog>
    )
}

function CommandDemo({ setDialogOpen, chats, loading }) { // Pass chats and loading as props

    const router = useRouter(); // Correctly initialize useRouter from next/navigation

    const handleNavigation = (path) => {
        setDialogOpen(false);
        router.push(`/chat/${path}`); // Navigate to /chat/[path]
    };

    if (loading) {
        return <div>Loading chats...</div>; // Or a skeleton loader
    }

    return (
        <Command>
            < CommandInput placeholder="Tìm kiếm" />
            <CommandList>
                <CommandEmpty>Không tìm thấy.</CommandEmpty>
                <CommandGroup heading="Conversations">
                    {chats.map((chat) => (
                        <CommandItem key={chat.id} onSelect={() => handleNavigation(chat.id)} className="cursor-pointer">
                            {/* You can add an icon here if you want */}
                            <span>{chat.title || "Untitled Chat"}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
