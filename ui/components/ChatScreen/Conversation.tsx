"use client"

import { useState, useRef, useEffect } from "react"
import { useUserChat } from "@/hooks/userChat"
import { getCookie, setCookie } from "cookies-next"
import { useParams } from "next/navigation" // Import useParams

interface Message {
    sender: "user" | "assistant"
    text: string
}

interface ConversationProps {
    isSidebarCollapsed: boolean
}

export function Conversation({ isSidebarCollapsed }: ConversationProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null);
    const { createChat, conversation } = useUserChat() // Removed getListConversations as it's not used here
    const params = useParams(); // Get URL parameters

    const currentConversationId = params.conversationID as string || null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => {
        const loadMessages = async () => {
            if (currentConversationId) {
                setMessages([]); // Clear previous messages
                try {
                    const fetchedConversation = await conversation({
                        conversation_id: currentConversationId,
                    });
                    if (Array.isArray(fetchedConversation.messages)) {
                        const newMessages = fetchedConversation.messages.map((message) => ({
                            sender: message.sender_type,
                            text: message.content,
                        }));
                        setMessages(newMessages);
                        // Optionally, ensure cookie is in sync with URL
                        setCookie("conversation_id", currentConversationId, { maxAge: 60 * 60 * 24 * 30, path: "/" });
                    }
                } catch (error) {
                    console.error("Failed to fetch conversation messages:", error);
                    // Handle error, e.g., show a toast message or redirect
                }
            } else {
                // No conversation ID in URL, so it's a new chat or a general page
                setMessages([]); // Clear messages if any
                // No need to clear cookie here as a new chat will set it, or it might be intentionally null
            }
        };

        loadMessages();
    }, [currentConversationId, conversation]);

    const handleSendMessage = async () => {
        if (input.trim() === "") return

        // Use currentConversationId from URL for the API call
        let response;
        if (currentConversationId === "new") {
            response = await createChat({
                message: input.trim(),
            })
        } else {

            response = await createChat({
                message: input.trim(),
                conversation_id: currentConversationId,
            })
        }

        // If it was a new chat (no currentConversationId), 
        // the createChat hook should have updated the ConversationID state,
        // which in turn should trigger navigation via its own useEffect.
        // For existing chats, the ID remains the same.

        setIsTyping(true); // Consider setting this false after bot responds

        const userMessage: Message = { sender: "user", text: input }
        // Add user message immediately for responsiveness
        setMessages((prev) => [...prev, userMessage]);

        // Simulate bot response for now, actual bot response should come from createChat's response
        // and be handled perhaps by adding to messages state from there or a websocket
        const assistantMessage: Message = {
            sender: "assistant",
            // text: `You said: "${input}"`, // This should be response.bot_message
            text: response.bot_message,
        }
        setMessages((prev) => [...prev, assistantMessage])

        setInput("")
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const containerClass = isTyping ? 'flex-1 flex justify-center bg-white transition-all duration-300 mb-5 overflow-hidden' : 'flex-1 flex justify-center items-center bg-white transition-all duration-300 overflow-hidden';

    return (
        <div
            className={`flex flex-col w-screen h-screen transition-all duration-300 ${isSidebarCollapsed ? "-ml-36" : "mx-auto w-full"
                }`}
        >
            {/* Title Area */}
            <div className="p-4 bg-white">
                <h2 className="text-xl font-semibold">Chatbot - Hệ thống tư vấn tuyển sinh thử nghiệm</h2>
            </div>

            {/* Chat Area */}
            <div className={containerClass}>
                <div
                    className={`flex flex-col w-3/5 h-[95%] max-h-screen transition-all duration-300 ${isSidebarCollapsed ? "-ml-36" : "mx-auto"
                        }`}
                >
                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col">
                        <div className="flex-1">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`mb-2 ${message.sender === "user" ? "text-right" : "text-left"
                                        }`}
                                >
                                    <div
                                        className={`inline-block px-4 py-2 rounded-lg ${message.sender === "user"
                                            ? "bg-gray-100 text-black"
                                            : "text-black bg-white"
                                            }`}
                                    >
                                        {message.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    < div className="p-3 border border-gray-300  rounded-md" >
                        <div className="flex items-center gap-2">
                            <textarea
                                className="flex-1 p-2 resize-none border border-white focus:border-white focus:ring focus:ring-white focus:outline-none rounded-md"
                                rows={2}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                            />
                            <button
                                className="px-4 py-2 bg-gray-900 text-white rounded-md cursor-pointer hover:bg-black"
                                onClick={handleSendMessage}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
