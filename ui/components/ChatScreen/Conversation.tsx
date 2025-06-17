"use client"

import { useState, useRef, useEffect } from "react"
import { useUserChat } from "@/hooks/userChat"
import { getCookie, setCookie } from "cookies-next"
import { useParams } from "next/navigation" // Import useParams
import { Copy, Check } from "lucide-react" // Import icons for copy functionality
import { toast } from "react-toastify" // For notification when copying

interface Message {
    sender: "user" | "bot"
    text: string
}

interface ConversationProps {
    isSidebarCollapsed: boolean
}

export function Conversation({ isSidebarCollapsed }: ConversationProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
    const messagesEndRef = useRef(null);
    const { createChat, conversation } = useUserChat() // Removed getListConversations as it's not used here
    const params = useParams(); // Get URL parameters

    const currentConversationId = params.conversationID as string || null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Reset copied state after a delay
    useEffect(() => {
        if (copiedMessageIndex !== null) {
            const timer = setTimeout(() => {
                setCopiedMessageIndex(null);
            }, 2000);
            
            return () => clearTimeout(timer);
        }
    }, [copiedMessageIndex]);

    // Handle copying a message
    const handleCopyMessage = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedMessageIndex(index);
                toast.success("Message copied to clipboard", {
                    position: "bottom-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            })
            .catch((error) => {
                console.error("Failed to copy message:", error);
                toast.error("Failed to copy message");
            });
    };

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

        // Add user message immediately for responsiveness
        const userMessage: Message = { sender: "user", text: input.trim() }
        setMessages((prev) => [...prev, userMessage]);

        // Show the typing indicator
        setIsTyping(true);

        try {
            // Use currentConversationId from URL for the API call
            let response;
            if (currentConversationId === "new") {
                response = await createChat({
                    message: input.trim(),
                    conversation_id: null,
                });
            } else {
                response = await createChat({
                    message: input.trim(),
                    conversation_id: currentConversationId,
                });
            }

            // Add the assistant's response once received
            const assistantMessage: Message = {
                sender: "assistant",
                text: response.bot_message,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            // Add an error message if the request fails
            const errorMessage: Message = {
                sender: "assistant",
                text: "Sorry, I couldn't process your request. Please try again later.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            // Hide the typing indicator once we have a response (or an error)
            setIsTyping(false);
            setInput("");
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const containerClass = 'flex-1 flex justify-center items-center bg-white transition-all duration-300 overflow-hidden'

    return (
        <div
            className={`flex flex-col w-screen h-screen transition-all duration-300 ${isSidebarCollapsed ? "-ml-36" : "mx-auto w-full"
                }`}
        >
            {/* Title Area */}
            <div className="p-4 bg-white">
                <h2 className="text-xl font-semibold">Chatbot - Hệ Thống Tư Vấn</h2>
            </div>

            {/* Chat Area */}
            <div className={containerClass}>
                <div
                    className={`flex flex-col w-3/5 max-h-screen h-[98%] transition-all duration-300 ${isSidebarCollapsed ? "-ml-36" : "mx-auto"
                        }`}
                >
                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col">
                        <div className="flex-1">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`mb-4 flex flex-col ${message.sender === "user" ? "items-end" : "items-start" // Flex column and alignment
                                        }`}
                                >
                                    {/* Message Bubble */}
                                    <div
                                        className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${message.sender === "user"
                                            ? "bg-gray-100 text-black"
                                            : "text-black bg-white border border-gray-200"
                                            }`}
                                    >
                                        {message.text}
                                    </div>

                                    {/* Copy button - below the message for assistant messages */}
                                    {message.sender === "bot" && (
                                        <button
                                            onClick={() => handleCopyMessage(message.text, index)}
                                            className="mt-1 p-1 rounded-md transition-opacity bg-white border border-gray-200 hover:bg-gray-100 flex items-center text-xs text-gray-500" // Adjusted classes
                                            title="Copy message"
                                        >
                                            {copiedMessageIndex === index ? (
                                                <Check className="h-3 w-3 mr-1 text-green-500" />
                                            ) : (
                                                <Copy className="h-3 w-3 mr-1 text-gray-500" />
                                            )}
                                            {copiedMessageIndex === index ? "Copied" : "Copy"}
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* AI Typing Indicator */}
                            {isTyping && (
                                <div className="mb-2 text-left">
                                    <div className="inline-block px-4 py-2 rounded-lg text-black bg-white">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                disabled={isTyping} // Disable input while AI is responding
                            />
                            <button
                                className={`px-4 py-2 text-white rounded-md cursor-pointer ${isTyping ? 'bg-gray-500' : 'bg-gray-900 hover:bg-black'}`}
                                onClick={handleSendMessage}
                                disabled={isTyping} // Disable button while AI is responding
                            >
                                {isTyping ? 'Thinking...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
