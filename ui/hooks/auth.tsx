"use client"
import { InUser, InLoginFormValues, InLoginResponse, InSignupFormValues, InSignupResponse } from "@/types";
import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/api/auth";
import { getCookie, setCookie } from "cookies-next";
import { toast } from "react-toastify";


interface AuthContextType {
    user: InUser | null;
    accessToken: string;
    refreshToken: string;
    login: (values: InLoginFormValues) => Promise<InLoginResponse | null>;
    logout: () => Promise<void>;
    signup: (values: InSignupFormValues) => Promise<InSignupResponse | null>;
    loading: boolean;
    isAuthenticated: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<InUser | null>(null);
    const [accessToken, setAccessToken] = useState("");
    const [refreshToken, setRefreshToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoggedout, setIsLoggedout] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const redirect = encodeURIComponent(pathname);

    useEffect(() => {
        // Skip session verification for public routes
        if (pathname === "/auth/login" || pathname === "/auth/signup") {
            setLoading(false);
            return;
        }

        const verifySession = async () => {
            try {
                const token = getCookie("access_token");
                const refreshToken = getCookie("refresh_token");

                if (!token || !refreshToken) {
                    return;
                }

                // Verify the token from the endpoint api
                const userData = await authApi.me(refreshToken.toString());
                setUser(userData);
                setAccessToken(token.toString());
                setRefreshToken(refreshToken.toString());
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error verifying session:", error);
                setUser(null);
                setAccessToken("");
                setRefreshToken("");
                setIsAuthenticated(false);
                setIsLoggedout(true);
                
                toast.error("Session expired. Please log in again.");
                router.push(`/auth/login?redirect=${redirect}`);
            } finally {
                setLoading(false);
            }
        }

        const intervalID = setInterval(() => {
            verifySession();
        }, 1000 * 60 * 5); // Check every 5 minutes

        return () => {
            clearInterval(intervalID);
        }
    }, [router, pathname]);

    useEffect(() => {
        if (isLoggedout && pathname !== "/auth/login" && pathname !== "/auth/signup") {
            router.push(`/auth/login?redirect=${redirect}`);
            setIsLoggedout(false);
        }
    }, [isLoggedout, pathname, router, redirect]);

    useEffect(() => {
        const loadUserFromToken = async () => {
            try {
                const token = getCookie("access_token");
                const refreshToken = getCookie("refresh_token");

                if (!token || !refreshToken) {
                    return;
                }

                // Verify the token from the endpoint api
                const userData = await authApi.me(refreshToken.toString());
                setUser(userData);
                setAccessToken(token.toString());
                setRefreshToken(refreshToken.toString());
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error loading user from token:", error);
                setUser(null);
                setAccessToken("");
                setRefreshToken("");
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        }
        loadUserFromToken();
    }, []);

    const login = async (values: InLoginFormValues) => {
        try {
            setLoading(true);
            const response: InLoginResponse = await authApi.login(values);

            if (response) {
                console.log("Login response:", response.access_token);
                setCookie("access_token", response.access_token, { maxAge: 60 * 60 * 30, path: "/" });
                setCookie("refresh_token", response.refresh_token, { maxAge: 60 * 60 * 30, path: "/" });
                setCookie("userrole", response.userrole, { maxAge: 60 * 60 * 30, path: "/" });

                const path = localStorage.getItem("redirectPath") || "/";
                const dataUser = await authApi.me(response.refresh_token);

                setUser(dataUser);
                setAccessToken(response.access_token);
                setRefreshToken(response.refresh_token);
                setIsAuthenticated(true);

                if (path == "/auth/login") {
                    if (dataUser.userrole === "ADMIN") {
                        router.push("/admin");
                    } else router.push("/");
                }
                else {
                    router.push(path);
                }
                return dataUser;
            }
            else {
                console.error("Login failed:");
                return null;
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            setUser(null);
            setAccessToken("");
            setRefreshToken("");
            setIsAuthenticated(false);
            setIsLoggedout(true);
            setCookie("access_token", "", { maxAge: -1, path: "/auth/login" });
            setCookie("refresh_token", "", { maxAge: -1, path: "/auth/login" });
            router.push(`/auth/login`);

        } catch (error) {
            console.error("Error logging out:", error);
        } finally {
            setLoading(false);
        }
    };

    const signup = async (values: InSignupFormValues) => {
        try {
            const result = await authApi.signup(values);

            if (result.status === "success" && result.data) {
                return result.data;
            } else {
                console.error("Signup failed:", result.message);
                return null;
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                login,
                logout,
                signup,
                loading,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
