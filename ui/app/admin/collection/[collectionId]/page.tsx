"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCookie } from "cookies-next";
import { Endpoints } from "@/endpoints";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    BarChart,
    DatabaseZap,
    FileText,
    Layers,
    Eye,
    Trash2,
} from "lucide-react";
import {
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    BarChart as RechartsBarChart,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUploadPanel } from "@/components/ui/FileUploadPanel";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader, // Corrected: Add AlertDialogHeader import
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button"; // Added: Import buttonVariants

interface CollectionStatsData {
    collection_id: string;
    collection_name: string;
    total_files: number;
    files_by_type: Record<string, number>;
}

// New Interfaces
interface FileDetail {
    id: string;
    name: string;
    type: string;
    size: number;
    collection_id: string;
    uploaded_at: string;
    // parsed_content_preview?: string; // Available from upload response, but not list response
}

interface FileListResponse {
    // Matching backend
    files: FileDetail[];
}

interface ChunkDetail {
    id: string; // Qdrant point ID
    text: string;
    file_id?: string;
    file_name?: string;
    chunk_sequence?: number;
}

interface ChunkListResponse {
    // Matching backend
    chunks: ChunkDetail[];
}

interface QdrantStatusData {
    // Based on QdrantCollectionStatusResponse
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    // files: FileDetail[]; // This is part of the response, but we'll fetch files separately for clarity or use listFilesForCollection
    num_qdrant_points: number;
    num_distinct_documents_in_qdrant: number;
    qdrant_collection_name: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function CollectionDetailPage() {
    const params = useParams();
    const collectionId = params.collectionId as string;

    // Existing states
    const [stats, setStats] = useState<CollectionStatsData | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsRefreshKey, setStatsRefreshKey] = useState(0);

    // New states
    const [qdrantStatus, setQdrantStatus] = useState<QdrantStatusData | null>(null);
    const [loadingQdrantStatus, setLoadingQdrantStatus] = useState(true);
    const [filesInCollection, setFilesInCollection] = useState<FileDetail[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [selectedFileForChunks, setSelectedFileForChunks] = useState<FileDetail | null>(null);
    const [fileChunks, setFileChunks] = useState<ChunkDetail[]>([]);
    const [loadingChunks, setLoadingChunks] = useState(false);
    const [isChunkModalOpen, setIsChunkModalOpen] = useState(false);

    // New state for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileDetail | null>(null);


    // Fetch Collection Statistics (existing)
    useEffect(() => {
        if (!collectionId) return;
        const fetchStats = async () => {
            setLoadingStats(true);
            try {
                const refreshToken = getCookie("refresh_token");
                const response = await fetch(Endpoints.getCollectionStats(collectionId), {
                    headers: { Authorization: `Bearer ${refreshToken}` },
                });
                const result = await response.json();
                if (response.ok) {
                    setStats(result);
                } else {
                    toast.error(`Failed to fetch collection stats: ${result.detail?.[0]?.msg || result.message || response.statusText}`);
                    setStats(null);
                }
            } catch (error) {
                console.error("Error fetching collection stats:", error);
                toast.error("An error occurred while fetching collection statistics.");
                setStats(null);
            }
            setLoadingStats(false);
        };
        fetchStats();
    }, [collectionId, statsRefreshKey]);

    // Fetch Qdrant Status (new)
    useEffect(() => {
        if (!collectionId) return;
        const fetchQdrantStatus = async () => {
            setLoadingQdrantStatus(true);
            try {
                const refreshToken = getCookie("refresh_token");
                const response = await fetch(Endpoints.getQdrantCollectionStatus(collectionId), {
                    headers: { Authorization: `Bearer ${refreshToken}` },
                });
                const result = await response.json();
                if (response.ok) {
                    setQdrantStatus(result);
                } else {
                    toast.error(`Failed to fetch Qdrant status: ${result.detail?.[0]?.msg || result.message || response.statusText}`);
                    setQdrantStatus(null);
                }
            } catch (error) {
                console.error("Error fetching Qdrant status:", error);
                toast.error("An error occurred while fetching Qdrant status.");
                setQdrantStatus(null);
            }
            setLoadingQdrantStatus(false);
        };
        fetchQdrantStatus();
    }, [collectionId, statsRefreshKey]); // Refresh Qdrant status along with other stats

    // Fetch Files in Collection (new)
    useEffect(() => {
        if (!collectionId) return;
        const fetchFiles = async () => {
            setLoadingFiles(true);
            try {
                const refreshToken = getCookie("refresh_token");
                const response = await fetch(Endpoints.listFilesForCollection(collectionId), {
                    headers: { Authorization: `Bearer ${refreshToken}` },
                });
                const result: FileListResponse = await response.json();
                if (response.ok) {
                    setFilesInCollection(result.files || []);
                } else {
                    // Adjusted error handling for FileListResponse
                    const errorDetail = result.detail || (result as any).message || response.statusText;
                    toast.error(`Failed to fetch files: ${errorDetail}`);
                    setFilesInCollection([]);
                }
            } catch (error) {
                console.error("Error fetching files:", error);
                toast.error("An error occurred while fetching files.");
                setFilesInCollection([]);
            }
            setLoadingFiles(false);
        };
        fetchFiles();
    }, [collectionId, statsRefreshKey]); // Refresh files list along with other stats

    const handleFileUploadSuccess = () => {
        toast.success("File upload finished. Refreshing data...");
        setStatsRefreshKey(prevKey => prevKey + 1); // This will trigger all useEffects dependent on it
    };

    const handleViewChunks = async (file: FileDetail) => {
        setSelectedFileForChunks(file);
        setIsChunkModalOpen(true);
        setLoadingChunks(true);
        setFileChunks([]); // Clear previous chunks
        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.listFileChunks(collectionId, file.id), {
                headers: { Authorization: `Bearer ${refreshToken}` },
            });
            const result: ChunkListResponse = await response.json();
            if (response.ok) {
                setFileChunks(result.chunks || []);
                if (!result.chunks || result.chunks.length === 0) {
                    toast.info("No chunks found for this file in Qdrant.");
                }
            } else {
                toast.error(`Failed to fetch chunks: ${response.statusText}`);
                setFileChunks([]);
            }
        } catch (error) {
            console.error("Error fetching chunks:", error);
            toast.error("An error occurred while fetching chunks.");
            setFileChunks([]);
        }
        setLoadingChunks(false);
    };

    // New function to handle file deletion
    const handleDeleteFile = async () => {
        if (!fileToDelete || !collectionId) return;

        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.deleteFileFromCollection(collectionId, fileToDelete.id), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${refreshToken}` },
            });

            if (response.ok) {
                toast.success(`File "${fileToDelete.name}" deleted successfully.`);
                setStatsRefreshKey(prevKey => prevKey + 1); // Refresh stats and file list
            } else {
                const errorResult = await response.json().catch(() => null);
                toast.error(`Failed to delete file: ${errorResult?.detail || response.statusText}`);
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            toast.error("An error occurred while deleting the file.");
        } finally {
            setShowDeleteConfirm(false);
            setFileToDelete(null);
        }
    };

    const openDeleteConfirm = (file: FileDetail) => {
        setFileToDelete(file);
        setShowDeleteConfirm(true);
    };


    const pieChartData = stats?.files_by_type
        ? Object.entries(stats.files_by_type).map(([name, value]) => ({ name, value }))
        : [];

    const barChartData = stats?.files_by_type
        ? Object.entries(stats.files_by_type).map(([name, value]) => ({ name, count: value }))
        : [];

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <header className="mb-6 md:mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {stats?.collection_name || qdrantStatus?.name || "Collection"} - Details
                </h1>
            </header>

            {/* Section for General and Qdrant Stats */}
            <section className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
                    Collection Overview
                </h2>
                {loadingStats || loadingQdrantStatus ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Files in DB</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_files ?? "N/A"}</div>
                                <p className="text-xs text-muted-foreground">
                                    Files recorded in the database for this collection.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Qdrant Points</CardTitle>
                                <DatabaseZap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{qdrantStatus?.num_qdrant_points ?? "N/A"}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total vector embeddings stored in Qdrant.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Indexed Documents in Qdrant</CardTitle>
                                <Layers className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{qdrantStatus?.num_distinct_documents_in_qdrant ?? "N/A"}</div>
                                <p className="text-xs text-muted-foreground">
                                    Unique documents with embeddings in Qdrant.
                                </p>
                                {qdrantStatus && <p className="text-xs text-muted-foreground pt-1">Qdrant Collection: {qdrantStatus.qdrant_collection_name}</p>}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </section>

            {/* Section for File Type Charts (existing) */}
            <section className="mb-8">
                 <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
                    File Type Distribution
                </h2>
                {loadingStats && !stats && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Skeleton className="h-80 w-full" />
                        <Skeleton className="h-80 w-full" />
                    </div>
                )}
                 {!loadingStats && !stats && pieChartData.length === 0 && (
                    <div className="text-center py-10 col-span-full">
                        <p className="text-xl text-muted-foreground">Could not load file statistics.</p>
                    </div>
                )}
                {stats && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="mr-2 h-5 w-5 text-primary" />
                                    File Types (Pie Chart)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pieChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-muted-foreground py-10">No file type data available.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BarChart className="mr-2 h-5 w-5 text-primary" />
                                    File Counts (Bar Chart)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {barChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsBarChart data={barChartData}>
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" fill="#82CA9D" />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-muted-foreground py-10">No file count data available.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </section>

            {/* Section for Uploaded Files Table (new) */}
            <section className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
                    Uploaded Documents
                </h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Files in Collection</CardTitle>
                        <CardDescription>
                            List of documents uploaded to this collection.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingFiles ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                            </div>
                        ) : filesInCollection.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Size</TableHead>
                                        <TableHead>Uploaded At</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filesInCollection.map((file) => (
                                        <TableRow key={file.id}>
                                            <TableCell className="font-medium">{file.name}</TableCell>
                                            <TableCell>{file.type}</TableCell>
                                            <TableCell className="text-right">{(file.size / 1024).toFixed(2)} KB</TableCell>
                                            <TableCell>{new Date(file.uploaded_at).toLocaleString()}</TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleViewChunks(file)}>
                                                    <Eye className="mr-1 h-4 w-4" /> Chunks
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(file)}>
                                                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No files found in this collection.</p>
                        )}
                    </CardContent>
                </Card>
            </section>


            {/* File Upload Panel (existing) */}
            {collectionId && (
                <section className="mt-8">
                     <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
                        Upload New Document
                    </h2>
                    <FileUploadPanel collectionId={collectionId} onFileUploadSuccess={handleFileUploadSuccess} />
                </section>
            )}

            {/* Modal for Displaying Chunks (new) */}
            <Dialog open={isChunkModalOpen} onOpenChange={setIsChunkModalOpen}>
                <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-[80vh] flex flex-col overflow-hidden"> {/* Changed max-h to h and ensured overflow-hidden */}
                    <DialogHeader>
                        <DialogTitle>Chunks for: {selectedFileForChunks?.name}</DialogTitle>
                        <DialogDescription>
                            Showing text chunks and their details as stored in Qdrant.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-grow min-h-0 pr-6 -mr-6"> {/* Added min-h-0 for proper scroll in flex */}
                        {loadingChunks ? (
                             <div className="space-y-2 py-4">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : fileChunks.length > 0 ? (
                            <div className="space-y-4 py-4">
                                {fileChunks.map((chunk, index) => (
                                    <Card key={chunk.id || index} className="bg-muted/50">
                                        <CardHeader className="pb-2 pt-4 px-4">
                                            <CardTitle className="text-sm font-semibold">
                                                Chunk {chunk.chunk_sequence !== undefined ? chunk.chunk_sequence + 1 : index + 1}
                                                {chunk.id && <span className="text-xs text-muted-foreground ml-2">(ID: {chunk.id.substring(0,8)}...)</span>}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-xs px-4 pb-4">
                                            <p className="whitespace-pre-wrap break-words">{chunk.text}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">
                                No chunks available for this file, or they are still being processed.
                            </p>
                        )}
                    </ScrollArea>
                    <DialogFooter className="mt-auto pt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this file?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the file
                            <span className="font-semibold"> {fileToDelete?.name} </span>
                            and all its associated data from the collection.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFileToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteFile}
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
