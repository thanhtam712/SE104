import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RenameConversationModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (newTitle: string) => void;
    currentTitle: string;
}

export function RenameConversationModal({ open, onClose, onSave, currentTitle }: RenameConversationModalProps) {
    const [title, setTitle] = useState(currentTitle);

    useEffect(() => {
        setTitle(currentTitle);
    }, [currentTitle, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(title);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Conversation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <Label className="my-2" htmlFor="conversationTitle">Title</Label>
                        <Input
                            id="conversationTitle"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button className="cursor-pointer" type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button className="cursor-pointer" type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
