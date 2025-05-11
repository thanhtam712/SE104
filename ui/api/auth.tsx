import { Endpoints } from "@/endpoints";
import { InUser, InLoginFormValues, InLoginResponse, InSignupFormValues, ResponseSignupAPI, UserRoles } from "@/types";

export const login = async (values: InLoginFormValues): Promise<InLoginResponse> => {
    const response = await fetch(Endpoints.login, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username: values.username,
            password: values.password,
        }),
    });

    const data: InLoginResponse = await response.json();
    return data;
}

export const signup = async (values: InSignupFormValues): Promise<ResponseSignupAPI> => {
    const response = await fetch(Endpoints.signup, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(
            {
                user_fullname: values.name,
                user_email: values.email,
                username: values.username,
                password: values.password,
                user_role: UserRoles.User,
            }
        ),
    });

    if (!response.ok) {
        throw new Error("Signup failed");
    }

    const data: ResponseSignupAPI = await response.json();
    return data;
}

export const me = async (token: string): Promise<InUser> => {
    const response = await fetch(Endpoints.me, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        console.error("Failed to fetch user data:", response.statusText);
        throw new Error("Failed to fetch user data");
    }

    const data: InUser = await response.json();
    return data;
}

export const authApi = {
    login,
    signup,
    me,
}
