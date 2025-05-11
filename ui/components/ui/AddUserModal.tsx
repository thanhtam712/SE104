import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface AddUserModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: {
        username: string;
        password: string;
        fullName: string;
        email: string;
        role: "ADMIN" | "USER";
    }) => boolean;
}

export function AddUserModal({ open, onClose, onSave }: AddUserModalProps) {
    const [form, setForm] = useState({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "USER" as "ADMIN" | "USER",
    });

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const res = onSave(form);

        if (res) {
            setForm({
                username: "",
                password: "",
                fullName: "",
                email: "",
                role: "USER",
            });
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    <div className="flex justify-between gap-8">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={form.username}
                            className="w-60"
                            onChange={(e) => handleChange("username", e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-between gap-8">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            className="w-60"
                            value={form.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-between gap-8">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            className="w-60"
                            value={form.fullName}
                            onChange={(e) => handleChange("fullName", e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-between gap-8">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            className="w-60"
                            onChange={(e) => handleChange("email", e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-between gap-8">
                        <Label htmlFor="role">Role</Label>
                        <Select value={form.role} onValueChange={(value) => handleChange("role", value)}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Add</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
