"use client"

interface ConversationProps {
    isSidebarCollapsed: boolean;
}

export function TitleChat({ isSidebarCollapsed }: ConversationProps) {
    return (
        <div
            className={`flex flex-col w-screen max-h-screen transition-all duration-300 ${isSidebarCollapsed ? "-ml-36" : "mx-auto"
                }`}
        >
            {/* Title Area */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-semibold">Chat with AI</h2>
            </div>
        </div>
    );
}
