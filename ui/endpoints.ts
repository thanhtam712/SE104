export const Endpoints = {
    login: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
    signup: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
    me: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
    createChat: `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/create`,
    getChatID: `${process.env.NEXT_PUBLIC_API_URL}/api/conversation`,
    getChatContent: (conversationId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/${conversationId}`,
    listUsers: `${process.env.NEXT_PUBLIC_API_URL}/api/user/`, // Added new endpoint for listing users
    updateUser: (userId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`,
    deleteUser: (userId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`,
};
