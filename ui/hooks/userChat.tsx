"use client"
import { InCreateChatPOSTRequest, InCreateChatPOSTResponse, InListConversationsGETResponse, InConversationGETRequest, InConversationGETResponse } from "@/types";
import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCookie, setCookie } from "cookies-next";
import { userChatApi } from "@/api/userChat";


interface UserChatContextType {
    accessToken: string;
    refreshToken: string;
    createChat: (values: InCreateChatPOSTRequest) => Promise<InCreateChatPOSTResponse>;
    listConversations: () => Promise<InListConversationsGETResponse>;
    conversation: (values: InConversationGETRequest) => Promise<InConversationGETResponse>;
    loading: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
}

export const UserChatContext = createContext<UserChatContextType | null>(null);

export const UserChatProvider = ({ children }: AuthProviderProps) => {
    const [accessToken, setAccessToken] = useState("");
    const [refreshToken, setRefreshToken] = useState("");
    const [ConversationID, setConversationID] = useState("");
    const [loading, setLoading] = useState(true);

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const verifySession = async () => {
            try {
                const refreshToken = getCookie("refresh_token");

                if (!refreshToken) {
                    return;
                }

                setRefreshToken(refreshToken.toString());
            } catch (error) {
                console.error("Error verifying session:", error);
                setAccessToken("");
                setRefreshToken("");
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    useEffect(() => {
        if (ConversationID && pathname !== `/chat/${ConversationID}`) {
            router.push(`/chat/${ConversationID}`);
        }
    }, [ConversationID, pathname, router]);


    const createChat = async (values: InCreateChatPOSTRequest): Promise<InCreateChatPOSTResponse> => {
        const response: InCreateChatPOSTResponse = await userChatApi.postCreateChat(values, refreshToken.toString());

        if (!ConversationID) {
            setConversationID(response.conversation_id);
            setCookie("conversation_id", response.conversation_id, { maxAge: 60 * 60 * 24 * 30, path: "/" });
        }

        if (!response) {
            throw new Error("Failed to store chat data");
        }
        setConversationID(response.conversation_id);

        return response;
    };

    const listConversations = async (): Promise<InListConversationsGETResponse> => {
        const response: InListConversationsGETResponse = await userChatApi.getListConversations(refreshToken.toString());

        if (!response) {
            throw new Error("Failed to fetch list of conversations");
        }

        return response;
    };

    const conversation = async (values: InConversationGETRequest): Promise<InConversationGETResponse> => {
        const response: InConversationGETResponse = await userChatApi.getConversation(values, refreshToken.toString());

        if (!response) {
            throw new Error("Failed to fetch chat content");
        }

        return response;
    };

    return (
        <UserChatContext.Provider
            value={{ accessToken, refreshToken, createChat, listConversations, conversation, loading }}>
            {children}
        </UserChatContext.Provider>
    );
}

export const useUserChat = () => {
    const context = useContext(UserChatContext);
    if (!context) {
        throw new Error("useUserChat must be used within a UserChatProvider");
    }
    return context;
}
