"use client"
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { cn } from "@/lib/utils";
import { InLoginFormValues } from "@/types";
import { Button, Form, Input, message } from "antd";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ValidateErrorEntity } from "rc-field-form/lib/interface";
import { useEffect, useState } from 'react';
import { Suspense } from "react";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const redirectPath = searchParams?.get("redirect") || "/";
        localStorage.setItem("redirectPath", redirectPath);
    }, [searchParams]);

    const successMessage = ({
        content,
        duration,
    }: {
        content: string;
        duration?: number;
    }) => {
        messageApi.open({
            type: "success",
            content: content,
            duration: duration || 2,
        });
    };

    const errorMessage = ({
        content,
        duration,
    }: {
        content: string;
        duration?: number;
    }) => {
        messageApi.open({
            type: "error",
            content: content,
            duration: duration || 2,
        });
    };

    const onFinish = async (values: InLoginFormValues) => {
        setLoading(true);

        try {
            await login(values);
            successMessage({
                content: "Login successful",
            });
        } catch (error) {
            console.error("Login error:", error);
            errorMessage({
                content: "Login failed 1234",
            });
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = async (errorInfo: ValidateErrorEntity<InLoginFormValues>) => {
        console.error("Login failed:", errorInfo);
        errorMessage({
            content: "Login failed, please check your information",
        });
    };

    return (
        <div className={cn("flex flex-col gap-8 items-center justify-center min-h-screen py-8", className)} {...props}>
            {contextHolder}
            <Card className="w-full max-w-5xl shadow-2xl rounded-3xl bg-white/70 backdrop-blur-md border-0">
                <CardContent className="grid grid-cols-1 md:grid-cols-2 p-0">
                    <div className="flex flex-col justify-center p-12 md:p-16">
                        <div className="flex flex-col items-center gap-4 mb-6 md:items-start">
                            {/* Logo for small screens, or if you prefer it here always */}
                            {/* <Image src="/chatbot_admission_logo.png" alt="Logo" width={48} height={48} className="rounded-full md:hidden" /> */}
                            <h1 className="text-2xl font-semibold text-foreground text-center md:text-left">Sign in to Admission Chatbot</h1>
                            <p className="text-muted-foreground text-sm text-center md:text-left">Enter your credentials to continue</p>
                        </div>
                        <Form
                            name="basic"
                            layout="vertical"
                            style={{ width: "100%" }}
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                        >
                            <div className="flex flex-col gap-0">
                                <Form.Item
                                    label="Username"
                                    name="username"
                                    rules={[{ required: true, message: "Please input your username!" }]}
                                    className="mb-0"
                                >
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Username"
                                        autoFocus
                                        required
                                        className="rounded-t-md border border-input border-b-0 focus:z-10 focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Password"
                                    name="password"
                                    rules={[{ required: true, message: "Please input your password!" }]}
                                    className="mb-0"
                                >
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        className="rounded-b-md border border-input focus:z-10 focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                                    />
                                </Form.Item>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <a
                                    href="/forgotPassword"
                                    className="text-sm text-muted-foreground hover:underline"
                                >
                                    Forgot your password?
                                </a>
                            </div>
                            <Button className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition" type="primary" htmlType="submit" loading={loading}>
                                Sign in
                            </Button>
                        </Form>
                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <a href="/auth/signup" className="underline underline-offset-4 hover:text-primary">Sign up</a>
                        </div>
                    </div>
                    <div className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 p-12 md:p-16 text-white rounded-r-xl">
                        <Image
                            src="/chatbot_admission_logo.png"
                            alt="Admission Chatbot Logo"
                            width={128}
                            height={128}
                            className="rounded-full"
                        />
                        <div className="mt-6 text-center">
                            <h2 className="text-2xl font-bold">Welcome Back!</h2>
                            <p className="mt-2 text-base opacity-90">
                                Sign in to continue managing your admissions.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}

export default function SignInFormWrapper(props: React.ComponentProps<"div">) {
    return (
        <Suspense fallback={null}>
            <LoginForm {...props} />
        </Suspense>
    );
}
