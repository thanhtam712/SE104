"use client"

import SignInFormWrapper, { LoginForm } from "@/components/AuthForm/SignInForm"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4">
                <SignInFormWrapper />
            </div>
        </div>
    )
}
