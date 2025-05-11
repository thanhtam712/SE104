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
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            {contextHolder}
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 pr-6 md:grid-cols-2">
                    {/* <form className="space-y-3 p-6 md:p-8"> */}
                    <Form
                        name="basic"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "100%",
                        }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                    >
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome to Chatbot</h1>
                                <p className="text-balance text-muted-foreground">
                                    Sign in to continue
                                </p>
                            </div>
                            <div className="grid gap-2">
                                {/* <Label htmlFor="email" name="username">Username</Label> */}
                                <Form.Item
                                    label="Username"
                                    name="username"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please input your username!",
                                        },
                                    ]}
                                >
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="username"
                                        autoFocus
                                        required
                                    />
                                </Form.Item>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    {/* <Label htmlFor="password">Password</Label> */}

                                    <a
                                        href="/forgotPassword"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Form.Item
                                    label="Password"
                                    name="password"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Please input your password!",
                                        },
                                    ]}
                                >
                                    <Input
                                        id="password"
                                        type="password"
                                        autoFocus
                                        required
                                    />
                                </Form.Item>
                            </div>
                            <input type="hidden" name="redirectTo" />

                            <Button className="mt-4 w-full" type="primary" htmlType="submit" loading={loading}>
                                Sign in
                            </Button>

                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {/* <form
                                    action={async () => {
                                        "use server"
                                        await signIn("google")
                                    }}
                                >
                                    <Button variant="outline" className="w-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path
                                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="sr-only">Login with Google</span>
                                    </Button>
                                </form> */}
                                {/* <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => signIn("google")}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    <span className="sr-only">Login with Google</span>
                                </Button> */}

                            </div>
                            <div className="text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <a href="/auth/signup" className="underline underline-offset-4">
                                    Sign up
                                </a>
                            </div>
                        </div>
                        {/* </form> */}
                    </Form>
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            src="/chatbot_admission_logo.png"
                            alt="Image"
                            fill
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
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
