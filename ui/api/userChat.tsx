import { Endpoints } from "@/endpoints";
import { InCreateChatPOSTRequest, InCreateChatPOSTResponse, InListConversationsGETResponse, InConversationGETRequest, InConversationGETResponse } from "@/types/index";


export const postCreateChat = async (values: InCreateChatPOSTRequest, token: string): Promise<InCreateChatPOSTResponse> => {
    const response = await fetch(Endpoints.createChat, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(values),
    });

    if (!response.ok) {
        throw new Error("Failed to create chat");
    }

    const data: InCreateChatPOSTResponse = await response.json();
    return data;
}

export const getListConversations = async (token: string): Promise<InListConversationsGETResponse> => {
    const response = await fetch(Endpoints.getChatID, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch list of conversations");
    }

    const data: InListConversationsGETResponse = await response.json();
    return data;
}

export const getConversation = async (values: InConversationGETRequest, token: string): Promise<InConversationGETResponse> => {
    const response = await fetch(`${Endpoints.getChatContent(values.conversation_id)}?${values.conversation_id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    const data: InConversationGETResponse = await response.json();
    return data;
}

export const userChatApi = {
    postCreateChat,
    getListConversations,
    getConversation,
}
