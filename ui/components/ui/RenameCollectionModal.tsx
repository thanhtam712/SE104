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

interface RenameCollectionModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (newName: string) => Promise<boolean>; // Returns true if save was successful
    currentName: string;
    collectionId: string;
}

export function RenameCollectionModal({
    open,
    onClose,
    onSave,
    currentName,
    collectionId,
}: RenameCollectionModalProps) {
    const [name, setName] = useState(currentName);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setName(currentName); // Reset name when modal opens or currentName changes
            setIsSaving(false);
        }
    }, [open, currentName]);

    const handleSave = async () => {
        if (!name.trim() || name.trim() === currentName) {
            // Optionally, show an error message for empty or unchanged name
            onClose(); // Close if name is unchanged
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
                    <DialogTitle>Rename Collection</DialogTitle>
                    <DialogDescription>
                        Enter a new name for the collection \'{currentName}\'. Click save when
                        you\'re done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            New Name
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
                    <Button
                        type="submit"
                        onClick={handleSave}
                        disabled={isSaving || !name.trim() || name.trim() === currentName}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
