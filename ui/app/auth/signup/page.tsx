"use client"

import SignUpFormWrapper from "@/components/AuthForm/SignUpForm"

export default function LogupPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-3xl">
                <SignUpFormWrapper />
            </div>
        </div>
    )
}
