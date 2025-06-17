import * as React from "react"
import { useRouter } from "next/navigation" // Import useRouter
import { deleteCookie } from "cookies-next"; // Import deleteCookie

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Edit } from "lucide-react";

export function CreateNewChat() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter(); // Initialize router

    const handleConfirm = (e) => {
        e.preventDefault();
        deleteCookie("conversation_id"); // Clear the conversation_id cookie
        setOpen(false);
        router.push('/chat/new'); // Navigate to a generic new chat page or a specific route that implies a new chat
                                // The page component for /chat/new or similar should handle creating a new chat session if needed
                                // or simply present a fresh chat interface.
                                // The existing logic in Conversation.tsx will see a null/undefined conversationID
                                // and the first message sent will create a new conversation.
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Create new chat"
                    className="focus:outline-none focus:ring-0 focus:ring-offset-0 p-4 cursor-pointer"
                >
                    <Edit className="h-32 w-32" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create new chat</DialogTitle>
                </DialogHeader>
                {/* Pass router and setOpen to ProfileForm if they are needed there, or handle logic directly */}
                <ProfileForm setOpen={setOpen} onConfirm={handleConfirm} />
            </DialogContent>
        </Dialog>
    )
}

function ProfileForm({ className, setOpen, onConfirm }: React.ComponentProps<"form"> & { setOpen: React.Dispatch<React.SetStateAction<boolean>>, onConfirm: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
    return (
        <form className={cn("grid items-start gap-4", className)} onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
            <span>This will clear your current chat context and start a new conversation. Are you sure you want to continue?</span>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={onConfirm} >Confirm</Button> {/* Use the passed onConfirm handler */}
            </div>
        </form>
    )
}
