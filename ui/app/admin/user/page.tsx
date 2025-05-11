"use client";
import { AddUserModal } from "@/components/ui/AddUserModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditUserModal } from "@/components/ui/EditUserModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Endpoints } from "@/endpoints"; // Import Endpoints
import { getCookie } from "cookies-next";
import { ChevronLeft, ChevronRight, Edit, Loader2, MoreVertical, PlusCircle, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner"; // For displaying error messages

// Updated User interface to match API response
interface ApiUser {
    id: string;
    username: string;
    user_fullname: string; // Added from API response
    user_email: string;
    user_role: string; // e.g., "UserRole.USER", "UserRole.ADMIN"
    created_at: string;
    updated_at: string; // Added from API response
    // status is not directly in API, we might need to derive or manage it client-side if needed
}

// Interface for the component's user state, can be slightly different from API if needed
interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: "Admin" | "User"; // Added 'User' and adjusted to simpler role names
    createdAt: string;
    status: "Active" | "Inactive"; // Assuming we might still want this, or derive it
}

interface ApiResponse {
    status: string;
    message: string;
    data: {
        users: ApiUser[];
        total_pages: number;
        current_page: number;
    };
}

const ITEMS_PER_PAGE = 10; // Default page size, can be overridden by API if necessary

// Helper to map API role to a simpler role for display
const mapApiRoleToDisplayRole = (apiRole: string): User["role"] => {
    if (apiRole.includes("ADMIN")) return "Admin";
    return "User"; // Default to User
};

export default function UserManagementPage() {
    // State management

    const [users, setUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    // const [filterStatus, setFilterStatus] = useState<string>("all"); // Status filter might need backend support
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);


    const fetchUsers = async (page: number, size: number, search: string = "", role: string = "all") => {
        setLoading(true);
        try {
            // Construct query parameters
            // Note: API must support search and role filtering for these to work
            // For now, we'll use client-side search/filter after fetching a page
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: size.toString(),
            });
            // if (search) params.append('search', search); // If API supports search
            // if (role !== 'all') params.append('role', role); // If API supports role filtering


            // const token = getCookie("access_token");
            const refreshToken = getCookie("refresh_token");

            const response = await fetch(`${Endpoints.listUsers}?${params.toString()}`, {
                headers: {
                    // Add Authorization header if needed, e.g., from localStorage or context
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${refreshToken}`,
                }
            });
            const result: ApiResponse = await response.json();

            if (result.status === "success") {
                const mappedUsers: User[] = result.data.users.map(apiUser => ({
                    id: apiUser.id,
                    username: apiUser.username,
                    fullName: apiUser.user_fullname,
                    email: apiUser.user_email,
                    role: mapApiRoleToDisplayRole(apiUser.user_role),
                    createdAt: apiUser.created_at,
                    status: "Active", // Placeholder: API doesn't provide status, defaulting to Active
                    // In a real app, status might come from another field or be managed separately
                }));
                setUsers(mappedUsers);
                setTotalPages(result.data.total_pages);
                setCurrentPage(result.data.current_page);
                // Assuming the API doesn't directly return total users, 
                // but we can estimate or get it if the API provides it.
                // For now, we'll calculate based on total_pages and current items if it's the last page.
                // This is a rough estimation if total_items isn't available.
                setTotalUsers(result.data.total_pages * size);
            } else {
                toast.error(`Failed to fetch users: ${result.message}`);
                alert(`Failed to fetch users: ${result.message}`);
                setUsers([]);
                setTotalPages(1);
                setCurrentPage(1);
                setTotalUsers(0);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("An error occurred while fetching users.");
            alert("An error occurred while fetching users.");
            setUsers([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalUsers(0);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers(currentPage, pageSize);
    }, [currentPage, pageSize]); // Re-fetch when currentPage or pageSize changes

    // Handler for updating user info
    const handleUpdateUser = async (userId: string, updatedData: Partial<User>) => {
        setLoading(true);
        try {
            const refreshToken = getCookie("refresh_token");
            // Map UI User fields to API fields
            const apiData: any = {
                username: updatedData.username,
                user_fullname: updatedData.fullName,
                user_email: updatedData.email,
                user_role: updatedData.role?.toUpperCase(),
                // Optionally include disabled and password if you have them in your UI
            };
            // Remove undefined fields
            Object.keys(apiData).forEach(key => apiData[key] === undefined && delete apiData[key]);

            const response = await fetch(Endpoints.updateUser(userId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`,
                },
                body: JSON.stringify(apiData),
            });

            const result = await response.json();
            if (response.ok && result.status === "success") {
                toast.success("User updated successfully.");
                fetchUsers(currentPage, pageSize); // Refresh users list
            } else {
                toast.error(`Failed to update user: ${result?.message || response.statusText}`);
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("An error occurred while updating the user.");
            alert("An error occurred while updating the user.");
        }
        setLoading(false);
    };

    // Handler for deleting a user
    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) {
            return;
        }
        setLoading(true);
        try {
            const refreshToken = getCookie("refresh_token");
            const response = await fetch(Endpoints.deleteUser(userId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${refreshToken}`,
                }
            });

            // Check if the response is OK and content type is JSON before parsing
            if (response.ok) {
                // Assuming successful deletion might return no content or a success message
                // If it returns JSON:
                // const result = await response.json();
                // if (result.status === "success" || response.status === 200) { // Adjust based on actual API response

                // For now, let's assume a 200 or 204 (No Content) means success
                if (response.status === 200 || response.status === 204) {
                    toast.success("User deleted successfully.");
                    // Refresh users list:
                    // If the current page becomes empty after deletion, try to go to the previous page or reset to page 1
                    if (users.length === 1 && currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                    } else {
                        fetchUsers(currentPage, pageSize);
                    }
                } else {
                    // Handle cases where response is OK but operation wasn't "successful" by API's own status
                    const result = await response.json().catch(() => null); // Try to parse JSON, but don't fail if not JSON
                    toast.error(`Failed to delete user: ${result?.message || response.statusText}`);
                }
            } else {
                const result = await response.json().catch(() => null);
                toast.error(`Failed to delete user: ${result?.message || response.statusText}`);
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("An error occurred while deleting the user.");
        }
        setLoading(false);
    };

    // Handler for opening edit modal
    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditModalOpen(true);
    };

    // Handler for saving user info from modal
    const handleSaveUser = (data: { username: string; fullName: string; email: string; role: User["role"] }) => {
        if (selectedUser) {
            handleUpdateUser(selectedUser.id, data);
        }
        setEditModalOpen(false);
        setSelectedUser(null);
    };

    // Handler for adding a new user
    const handleAddUser = async (data: { username: string; password: string; fullName: string; email: string; role: string }) => {
        setLoading(true);
        try {
            const response = await fetch(Endpoints.signup, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: data.username,
                    password: data.password,
                    user_fullname: data.fullName,
                    user_email: data.email,
                    user_role: data.role,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("User added successfully.");
                setAddModalOpen(false);
                fetchUsers(currentPage, pageSize);
                return true;
            } else {
                alert(result.message);
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("An error occurred while adding the user.");
        }
        setLoading(false);
        return false;
    };

    // Client-side filtering for now, as API filtering setup is not specified
    const filteredUsers = useMemo(() => {
        return users
            .filter((user) =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter((user) => filterRole === "all" || user.role === filterRole);
        // .filter((user) => filterStatus === "all" || user.status === filterStatus); // Status filter removed for now
    }, [users, searchTerm, filterRole]);

    // Pagination for client-side filtered results (if not using API's pagination directly for display)
    // However, with API pagination, `paginatedUsers` should ideally just be `users` from the API response for the current page.
    // The current setup fetches a page and then client-filters it. 
    // For true server-side search/filter, `fetchUsers` would need to pass those params.
    const paginatedUsers = filteredUsers; // Since API already paginates, we display the fetched (and then client-filtered) users.

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        // setCurrentPage(1); // Reset to page 1 if search is server-side
        // fetchUsers(1, pageSize, term, filterRole); // If search is server-side
    };

    const handleRoleFilterChange = (role: string) => {
        setFilterRole(role);
        // setCurrentPage(1); // Reset to page 1 if filter is server-side
        // fetchUsers(1, pageSize, searchTerm, role); // If filter is server-side
    };

    const getStatusBadgeVariant = (status: "Active" | "Inactive") => {
        return status === "Active" ? "default" : "destructive";
    };

    const getRoleBadgeVariant = (role: User["role"]) => {
        switch (role) {
            case "Admin":
                return "default";
            case "User":
                return "outline"; // Or another variant for 'User'
            default:
                return "outline";
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 flex justify-center flex-col">
            <header className="mb-6 md:mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    User Management
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage all users in the system.
                </p>
            </header>

            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by username, email, name..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={filterRole} onValueChange={handleRoleFilterChange}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="User">User</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* Status filter removed for now as it's not in API response
                    <Select value={filterStatus} onValueChange={(value) => {setFilterStatus(value); setCurrentPage(1);}}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select> */}
                    <Button className="w-full sm:w-auto" onClick={() => setAddModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border shadow-sm bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Username</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-[100px]">Role</TableHead>
                            <TableHead className="w-[180px]">Created At</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Loading users...</p>
                                </TableCell>
                            </TableRow>
                        ) : paginatedUsers.length > 0 ? (
                            paginatedUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.fullName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(user.status)}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
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
                                    colSpan={7} // Increased colspan
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No users found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        {/* Showing {Math.min(1 + (currentPage -1) * pageSize, totalUsers)} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users */}
                        Page {currentPage} of {totalPages}. Total users: (approx. {totalUsers})
                        {/* The above totalUsers is an estimation. If API provides exact total items, use that. */}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
            {selectedUser && (
                <EditUserModal
                    open={editModalOpen}
                    onClose={() => { setEditModalOpen(false); setSelectedUser(null); }}
                    onSave={handleSaveUser}
                    initialData={{
                        username: selectedUser.username,
                        fullName: selectedUser.fullName,
                        email: selectedUser.email,
                        role: selectedUser.role,
                    }}
                />
            )}
            <AddUserModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSave={handleAddUser}
            />
        </div>

    );
}
