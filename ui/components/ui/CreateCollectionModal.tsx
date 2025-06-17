"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface CreateCollectionModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (name: string) => Promise<boolean>; // Returns true if save was successful
}

export function CreateCollectionModal({ open, onClose, onSave }: CreateCollectionModalProps) {
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setName(""); // Reset name when modal opens
            setIsSaving(false);
        }
    }, [open]);

    const handleSave = async () => {
        if (!name.trim()) {
            // Optionally, show an error message for empty name
            return;
        }
        setIsSaving(true);
        const success = await onSave(name.trim());
        setIsSaving(false);
        if (success) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Collection</DialogTitle>
                    <DialogDescription>
                        Enter a name for your new collection. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            disabled={isSaving}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSave} disabled={isSaving || !name.trim()}>
                        {isSaving ? "Saving..." : "Save Collection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
