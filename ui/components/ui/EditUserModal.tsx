import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface EditUserModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: {
        username: string;
        fullName: string;
        email: string;
        role: "Admin" | "Editor" | "Viewer" | "User";
    }) => void;
    initialData: {
        username: string;
        fullName: string;
        email: string;
        role: "Admin" | "Editor" | "Viewer" | "User";
    };
}

export function EditUserModal({ open, onClose, onSave, initialData }: EditUserModalProps) {
    const [form, setForm] = useState(initialData);

    useEffect(() => {
        setForm(initialData);
    }, [initialData, open]);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User Info</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-9">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={form.username}
                            onChange={(e) => handleChange("username", e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex gap-16">
                        <Label htmlFor="fullName">Name</Label>
                        <Input
                            id="fullName"
                            value={form.fullName}
                            onChange={(e) => handleChange("fullName", e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex gap-16">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex gap-16">
                        <Label htmlFor="role">Role</Label>
                        <Select value={form.role} onValueChange={(value) => handleChange("role", value)}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="User">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
