"use client";

import { CreateCollectionModal } from "@/components/ui/CreateCollectionModal";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Endpoints } from "@/endpoints";
import { getCookie } from "cookies-next";
import { FolderKanban, Loader2, PlusCircle, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RenameCollectionModal } from "@/components/ui/RenameCollectionModal";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { useRouter } from "next/navigation";

interface CollectionFile {
    name: string;
    id: string;
    type: string;
    size: number;
    uploaded_at: string;
}

interface Collection {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    files: CollectionFile[];
    is_active: boolean; // Added is_active field
}

interface ListCollectionsResponse {
    collections: Collection[];
}

// Changed to type aliases as they don't add new members
type CreateCollectionResponse = Collection;
type UpdateCollectionResponse = Collection;

interface ApiErrorDetail {
    loc: (string | number)[];
    msg: string;
    type: string;
}

interface ApiError {
    detail?: ApiErrorDetail[] | string; // Support both FastAPI detail structures and simple messages
    message?: string; // Support general message property
}

export default function CollectionManagementPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const router = useRouter();

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.listCollections, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${refreshToken}`,
                },
            });
            const result: ListCollectionsResponse = await response.json();

            if (response.ok) {
                setCollections(result.collections || []);
            } else {
                toast.error(
                    `Failed to fetch collections: ${response.statusText}`
                );
                setCollections([]);
            }
        } catch (error) {
            console.error("Error fetching collections:", error);
            toast.error("An error occurred while fetching collections.");
            setCollections([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const handleCreateCollection = async (name: string): Promise<boolean> => {
        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.createCollection, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${refreshToken}`,
                },
                body: JSON.stringify({ name, is_active: true }), // Assuming new collections are active by default
            });

            const result: CreateCollectionResponse = await response.json();

            if (response.status === 201 && result.id) {
                toast.success(`Collection '${name}' created successfully.`);
                fetchCollections(); // Refresh the list
                return true;
            } else {
                const errorData = result as ApiError;
                const errorMessage = typeof errorData.detail === 'string' 
                    ? errorData.detail 
                    : errorData.detail?.[0]?.msg || errorData.message || response.statusText;
                toast.error(
                    `Failed to create collection: ${errorMessage}`
                );
                return false;
            }
        } catch (error) {
            console.error("Error creating collection:", error);
            toast.error("An error occurred while creating the collection.");
            return false;
        }
    };

    const handleRenameCollection = async (newName: string): Promise<boolean> => {
        if (!selectedCollection) return false;
        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.updateCollection(selectedCollection.id), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${refreshToken}`,
                },
                body: JSON.stringify({ name: newName }),
            });

            const result: UpdateCollectionResponse = await response.json();

            if (response.ok && result.id) {
                toast.success(`Collection \'${selectedCollection.name}\' renamed to \'${newName}\' successfully.`);
                fetchCollections(); // Refresh the list
                return true;
            } else {
                const errorData = result as ApiError;
                const errorMessage = typeof errorData.detail === 'string' 
                    ? errorData.detail 
                    : errorData.detail?.[0]?.msg || errorData.message || response.statusText;
                toast.error(
                    `Failed to rename collection: ${errorMessage}`
                );
                return false;
            }
        } catch (error) {
            console.error("Error renaming collection:", error);
            toast.error("An error occurred while renaming the collection.");
            return false;
        }
    };

    const handleDeleteCollection = async () => {
        if (!selectedCollection) return;
        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.deleteCollection(selectedCollection.id), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            });

            if (response.status === 204) {
                toast.success(`Collection \'${selectedCollection.name}\' deleted successfully.`);
                fetchCollections(); // Refresh the list
            } else {
                try {
                    const errorData: ApiError = await response.json();
                    const errorMessage = typeof errorData.detail === 'string' 
                        ? errorData.detail 
                        : errorData.detail?.[0]?.msg || errorData.message || response.statusText;
                    toast.error(
                        `Failed to delete collection: ${errorMessage}`
                    );
                } catch (_parseError) { // If response is not JSON or errorData structure is unexpected
                    toast.error(
                        `Failed to delete collection: ${response.statusText}`
                    );
                }
            }
        } catch (error) {
            console.error("Error deleting collection:", error);
            toast.error("An error occurred while deleting the collection.");
        }
    };

    const handleToggleCollectionStatus = async (collectionId: string, newIsActive: boolean): Promise<void> => {
        // Optimistic UI update
        const originalCollections = [...collections];
        setCollections(prevCollections =>
            prevCollections.map(c =>
                c.id === collectionId ? { ...c, is_active: newIsActive } : c
            )
        );

        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.updateCollection(collectionId), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${refreshToken}`,
                },
                body: JSON.stringify({ is_active: newIsActive }),
            });

            const result: UpdateCollectionResponse = await response.json();

            if (response.ok && result.id) {
                toast.success(`Collection \'${result.name}\' status updated to ${newIsActive ? "active" : "inactive"}.`);
                // Fetch collections to ensure UI is in sync with the server, 
                // though optimistic update should already reflect the change.
                fetchCollections(); 
            } else {
                // Revert optimistic update on failure
                setCollections(originalCollections);
                const errorData = result as ApiError;
                const errorMessage = typeof errorData.detail === 'string' 
                    ? errorData.detail 
                    : errorData.detail?.[0]?.msg || errorData.message || response.statusText;
                toast.error(
                    `Failed to update collection status: ${errorMessage}`
                );
            }
        } catch (error) {
            // Revert optimistic update on network or other errors
            setCollections(originalCollections);
            console.error("Error updating collection status:", error);
            toast.error("An error occurred while updating the collection status.");
        }
    };

    const handleViewCollection = (collectionId: string) => {
        router.push(`/admin/collection/${collectionId}`);
    };

    const openRenameModal = (collection: Collection) => {
        setSelectedCollection(collection);
        setIsRenameModalOpen(true);
    };

    const openDeleteModal = (collection: Collection) => {
        setSelectedCollection(collection);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
            <header className="mb-6 md:mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
                        <FolderKanban className="mr-3 h-8 w-8" /> Collection Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your document collections.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Collection
                </Button>
            </header>

            <div className="rounded-lg border shadow-sm bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Name</TableHead>
                            <TableHead className="w-[10%]">Files</TableHead>
                            <TableHead className="w-[20%]">Created At</TableHead>
                            <TableHead className="w-[20%]">Last Updated</TableHead>
                            <TableHead className="w-[10%] text-center">Status</TableHead> {/* Added Status column */}
                            <TableHead className="w-[10%] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center"> {/* Adjusted colSpan to 6 */}
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Loading collections...</p>
                                </TableCell>
                            </TableRow>
                        ) : collections.length > 0 ? (
                            collections.map((collection) => (
                                <TableRow 
                                    key={collection.id} 
                                    className="hover:bg-muted/50 cursor-pointer" 
                                    onClick={(e) => {
                                        // Prevent row click if the click target is the checkbox or its container
                                        if ((e.target as HTMLElement).closest('.status-toggle-cell')) {
                                            return;
                                        }
                                        handleViewCollection(collection.id);
                                    }}
                                >
                                    <TableCell className="font-medium">{collection.name}</TableCell>
                                    <TableCell>{collection.files?.length || 0}</TableCell>
                                    <TableCell>
                                        {new Date(collection.created_at).toLocaleDateString()}{" "}
                                        {new Date(collection.created_at).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(collection.updated_at).toLocaleDateString()}{" "}
                                        {new Date(collection.updated_at).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell className="text-center status-toggle-cell"> {/* Added cell for status toggle */}
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-primary"
                                            checked={collection.is_active}
                                            onChange={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                handleToggleCollectionStatus(collection.id, !collection.is_active);
                                            }}
                                            onClick={(e) => e.stopPropagation()} // Ensure click on checkbox itself is stopped
                                            aria-label={`Toggle status for ${collection.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem onClick={() => handleViewCollection(collection.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openRenameModal(collection)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openDeleteModal(collection)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={6} // Adjusted colspan to 6
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No collections found. Get started by creating one.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateCollectionModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateCollection}
            />
            {selectedCollection && (
                <>
                    <RenameCollectionModal
                        open={isRenameModalOpen}
                        onClose={() => {
                            setIsRenameModalOpen(false);
                            setSelectedCollection(null);
                        }}
                        onSave={handleRenameCollection}
                        currentName={selectedCollection.name}
                        collectionId={selectedCollection.id}
                    />
                    <DeleteConfirmationModal
                        open={isDeleteModalOpen}
                        onClose={() => {
                            setIsDeleteModalOpen(false);
                            setSelectedCollection(null);
                        }}
                        onConfirm={handleDeleteCollection}
                        itemName={selectedCollection.name}
                        itemType="collection"
                    />
                </>
            )}
        </div>
    );
}
