"use client";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface DeleteConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    itemName: string; // To display the name of the item being deleted
    itemType?: string; // Optional: to specify the type of item e.g., "collection", "user"
}

export function DeleteConfirmationModal({
    open,
    onClose,
    onConfirm,
    itemName,
    itemType = "item",
}: DeleteConfirmationModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
        onClose(); // Close the modal after deletion attempt
    };

    return (
        <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the {itemType} named{" "}
                        <strong>{itemName}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}