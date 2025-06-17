"use client";

import { useState, useCallback, ChangeEvent } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Endpoints } from "@/endpoints";
import { getCookie } from "cookies-next";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";

interface FileUploadPanelProps {
    collectionId: string;
    onFileUploadSuccess: () => void; // Callback to refresh stats or list
}

interface UploadedFileResponse {
    name: string;
    type: string;
    size: number;
    id: string;
    collection_id: string;
    uploaded_at: string;
    parsed_content_preview?: string;
}

export function FileUploadPanel({ collectionId, onFileUploadSuccess }: FileUploadPanelProps) {
    const [files, setFiles] = useState<FileWithPath[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({}); // For individual file progress

    const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
        setFiles((prevFiles) => [...prevFiles, ...acceptedFiles.filter(file => {
            // Optional: Add file type/size validation here before adding to the list
            // Example: if (file.size > MAX_SIZE) { toast.error(...); return false; }
            return true;
        })]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        // Example accept prop:
        // accept: {
        // 'application/pdf': ['.pdf'],
        // 'text/plain': ['.txt'],
        // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        // 'application/msword': ['.doc'],
        // },
        // onDropRejected: (fileRejections) => {
        // fileRejections.forEach(({ file, errors }) => {
        // errors.forEach(error => {
        // toast.error(`File ${file.name}: ${error.message}`);
        // });
        // });
        // }
    });

    const removeFile = (fileToRemove: FileWithPath) => {
        setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.info("Please select files to upload.");
            return;
        }

        setUploading(true);
        setUploadProgress({});
        let allSucceeded = true;
        const newUploadProgress: Record<string, number> = {};

        // Initialize progress for all files
        files.forEach(file => newUploadProgress[file.name] = 0);
        setUploadProgress(newUploadProgress);

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const refreshToken = getCookie("refresh_token");
                // Actual upload request
                const response = await fetch(Endpoints.uploadFileToCollection(collectionId), {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                    },
                    body: formData,
                });

                // Update progress to 100% on completion (success or failure to get response)
                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

                if (response.status === 201) {
                    const result: UploadedFileResponse = await response.json();
                    toast.success(`File '${result.name}' uploaded successfully.`);
                } else {
                    allSucceeded = false;
                    const errorResult = await response.json().catch(() => ({ message: "Unknown error structure" }));
                    toast.error(
                        `Failed to upload '${file.name}': ${errorResult.detail?.[0]?.msg || errorResult.message || response.statusText}`
                    );
                    setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // Mark as error
                }
            } catch (error: any) {
                allSucceeded = false;
                setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // Mark as error
                toast.error(`Error uploading '${file.name}': ${error.message || "Network error"}`);
                console.error("Upload error:", error);
            }
        }

        setUploading(false);
        if (allSucceeded) {
            setFiles([]); // Clear files after successful upload of all
            onFileUploadSuccess(); // Trigger refresh
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                    Drag and drop files here, or click to select files to add to this collection.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    {...getRootProps()}
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer
                        ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/70"}
                        transition-colors duration-200 ease-in-out`}
                >
                    <input {...getInputProps()} />
                    <UploadCloud className={`h-12 w-12 mb-3 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                    {isDragActive ? (
                        <p className="text-primary">Drop the files here ...</p>
                    ) : (
                        <p className="text-muted-foreground">Drag 'n' drop files here, or click to select</p>
                    )}
                </div>

                {files.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Selected Files ({files.length}):</h4>
                        <ScrollArea className="h-40 w-full rounded-md border p-3">
                            <ul className="space-y-2">
                                {files.map((fileItem, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                                    >
                                        <div className="flex items-center space-x-2 overflow-hidden">
                                            <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                            <span className="truncate" title={fileItem.name}>{fileItem.name}</span>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                                ({(fileItem.size / 1024).toFixed(2)} KB)
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            {uploading && uploadProgress[fileItem.name] !== undefined && uploadProgress[fileItem.name] >= 0 && uploadProgress[fileItem.name] < 100 && (
                                                <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                                            )}
                                            {uploadProgress[fileItem.name] === -1 && (
                                                <X className="h-4 w-4 text-destructive mr-2" />
                                            )}
                                            {!uploading && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                        e.stopPropagation();
                                                        removeFile(fileItem);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                        <Button onClick={handleUpload} disabled={uploading || files.length === 0} className="w-full cursor-pointer">
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                `Upload ${files.length} File(s)`
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
