import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Suspense, useEffect, useState } from "react"

import { InSignupFormValues } from "@/types"
import { useAuth } from "@/hooks/auth"
import { useSearchParams } from "next/navigation"
import { message, Form, Button, Input as AntdInput } from "antd"
import { ValidateErrorEntity } from "rc-field-form/lib/interface"

export function LogupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
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

    const onFinish = async (values: InSignupFormValues) => {
        setLoading(true);

        try {
            await signup(values);
            successMessage({
                content: "Sign up successful",
            });
        } catch (error) {
            console.error("Sign up error:", error);
            errorMessage({
                content: "Sign up failed",
            });
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = (errorInfo: ValidateErrorEntity<InSignupFormValues>) => {
        console.error("Sign up Failed:", errorInfo);
        errorMessage({
            content: "Sign up failed",
        });
    };

    return (
        <div className={cn("flex flex-col gap-8 items-center justify-center", className)} {...props}>
            {contextHolder}
            <Card className="w-full max-w-3xl shadow-lg border-0">
                <CardContent className="grid grid-cols-1 md:grid-cols-2 p-0">
                    <div className="flex flex-col justify-center p-8 md:p-12">
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
                            <p className="text-muted-foreground text-base">Sign up to get started with Admission Chatbot</p>
                        </div>
                        <Form
                            name="basic"
                            layout="vertical"
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="Full Name"
                                name="name"
                                rules={[{ required: true, message: "Please input your full name!" }]}
                            >
                                <Input id="fullname" type="text" placeholder="Your name" />
                            </Form.Item>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ required: true, type: "email", message: "Please input a valid email!" }]}
                            >
                                <Input id="email" type="email" placeholder="example@gmail.com" />
                            </Form.Item>
                            <Form.Item
                                label="Username"
                                name="username"
                                rules={[
                                    { required: true, message: "Please input your username!" },
                                    () => ({
                                        validator(_, value) {
                                            if (!value || value.length >= 3) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Username must be at least 3 characters"));
                                        }
                                    })
                                ]}
                            >
                                <Input id="username" type="text" placeholder="Username" />
                            </Form.Item>
                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[
                                    { required: true, message: "Please input your password!" },
                                    () => ({
                                        validator(_, value) {
                                            if (!value || value.length >= 6) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Password must be at least 6 characters"));
                                        }
                                    })
                                ]}
                            >
                                <AntdInput.Password id="password" placeholder="Password" size="large" />
                            </Form.Item>
                            <Form.Item
                                label="Confirm Password"
                                name="confirmPassword"
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: "Please confirm your password!" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Passwords do not match!"));
                                        }
                                    })
                                ]}
                            >
                                <AntdInput.Password id="confirmPassword" placeholder="Confirm password" size="large" />
                            </Form.Item>
                            <Button className="w-full mt-2" type="primary" htmlType="submit" loading={loading} size="large">
                                Sign up
                            </Button>
                        </Form>
                        <div className="text-center text-sm mt-6">
                            Already have an account?{' '}
                            <a href="/auth/login" className="underline underline-offset-4 text-primary font-medium">Sign in</a>
                        </div>
                    </div>
                    <div className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 p-12 text-white">
                        <Image
                            src="/chatbot_admission_logo.png"
                            alt="Admission Chatbot Logo"
                            width={128}
                            height={128}
                            className="rounded-full"
                        />
                        <div className="mt-6 text-center">
                            <h2 className="text-2xl font-bold">Welcome!</h2>
                            <p className="mt-2 text-base opacity-90">
                                Join us to streamline your admission process with our intelligent chatbot.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}

export default function SignUpFormWrapper(props: React.ComponentProps<"div">) {
    return (
        <Suspense fallback={null}>
            <LogupForm {...props} />
        </Suspense>
    );
}

