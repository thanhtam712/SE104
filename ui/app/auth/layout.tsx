import { AuthProvider } from "@/hooks/auth";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    )
}
