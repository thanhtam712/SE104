export enum UserRoles {
    Admin = "ADMIN",
    User = "USER",
}

export interface InUser {
    id: string;
    name: string;
    username: string;
    password: string;
    email: string;
    userrole: UserRoles;
}

export interface InLoginFormValues {
    username: string;
    password: string;
}

export interface InLoginResponse {
    session_id: string;
    name: string;
    username: string;
    email: string;
    userrole: UserRoles;
    access_token: string;
    access_token_expires_in: Date;
    refresh_token: string;
    refresh_token_expires_in: Date;
}

export interface InSignupFormValues {
    name: string;
    username: string;
    password: string;
    email: string;
    userrole: UserRoles;
}

export interface InSignupResponse {
    id: string;
    name: string;
    username: string;
    email: string;
    userrole: UserRoles;
    created_at: Date;
    updated_at: Date;
}

// export interface ResponseLoginAPI {
//     status: string;
//     message: string;
//     data: InLoginResponse | null;
// }

export interface ResponseSignupAPI {
    status: string;
    message: string;
    data: InSignupResponse | null;
}

export interface InAPIResponse<d> {
    status: number;
    message: string;
    data: d;
}

export interface Conversation {
    id: string;
    created_at: Date;
    updated_at: Date;
    title: string;
}

export interface Message {
    id: string;
    sender_type: "user" | "assistant";
    content: string;
    created_at: Date;
}

export interface InCreateChatPOSTRequest {
    message: string;
    conversation_id: string | null;
}

export interface InCreateChatPOSTResponse {
    conversation_id: string;
    user_message: string;
    bot_message: string;
    created_at: Date;
}

export interface InListConversationsGETResponse {
    conversations: Conversation[];
}

export interface InConversationGETRequest {
    conversation_id: string;
}

export interface InConversationGETResponse {
    conversation_id: string;
    messages: Message[];
}
