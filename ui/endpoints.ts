export const Endpoints = {
    login: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
    signup: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
    me: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
    createChat: `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/create`,
    getChatID: `${process.env.NEXT_PUBLIC_API_URL}/api/conversation`,
    getChatContent: (conversationId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/${conversationId}`,
    updateConversationTitle: (conversationId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/${conversationId}`,
    deleteConversation: (conversationId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/${conversationId}`, // Added for deleting conversation
    listUsers: `${process.env.NEXT_PUBLIC_API_URL}/api/user/`, // Added new endpoint for listing users
    updateUser: (userId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`,
    deleteUser: (userId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`,
    getAdminStats: `${process.env.NEXT_PUBLIC_API_URL}/api/admin/analysis/stats`,
    // Collection Endpoints
    listCollections: `${process.env.NEXT_PUBLIC_API_URL}/api/collection/`,
    createCollection: `${process.env.NEXT_PUBLIC_API_URL}/api/collection/`,
    updateCollection: (collectionId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}`,
    deleteCollection: (collectionId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}`,
    getCollectionStats: (collectionId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}/stats`,
    uploadFileToCollection: (collectionId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}/files/upload`,
    getQdrantCollectionStatus: (collectionId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}/qdrant-status`,
    listFilesForCollection: (collectionId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}/files`,
    listFileChunks: (collectionId: string, fileId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}/files/${fileId}/chunks`,
    // New endpoint for deleting a file
    deleteFileFromCollection: (collectionId: string, fileId: string) => `${process.env.NEXT_PUBLIC_API_URL}/api/collection/${collectionId}/files/${fileId}`,
};

export const AuthEndpoints = {
    login: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
    signup: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
    me: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
};
