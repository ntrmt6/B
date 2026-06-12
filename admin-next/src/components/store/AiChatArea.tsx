import React from 'react';
import { Bot, ShoppingBag, Loader2 } from 'lucide-react';

export interface AiChatMessage {
    role: 'user' | 'model';
    text: string;
    image?: {
        type: 'image';
        url: string;
        alt: string;
        price: number;
    };
    image_card?: {
        type: 'image_card';
        url: string;
        alt: string;
        price: number;
        productId: number;
    };
    checkout_action?: {
        type: 'checkout_action';
        url: string;
        label: string;
        productId: number;
    };
}

interface AiChatAreaProps {
    aiMessages: AiChatMessage[];
    aiLoading: boolean;
    aiMessagesEndRef: React.RefObject<HTMLDivElement>;
    onAiSend: (text: string) => void;
}

/** Quick-start suggestions shown when the AI chat is empty. */
const aiQuickReplies = [
    { label: 'পণ্য দেখান', message: 'আপনার কি কি পণ্য আছে?' },
    { label: 'দাম জানুন', message: 'আপনার পণ্যের দাম কত?' },
    { label: 'ছবি দেখুন', message: 'আমাকে একটি পণ্যের ছবি দেখান' },
];

/** Renders the AI chat message area – welcome screen or message list. */
export const AiChatArea: React.FC<AiChatAreaProps> = ({
    aiMessages,
    aiLoading,
    aiMessagesEndRef,
    onAiSend,
}) => {
    if (aiMessages.length === 0) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-5 max-w-[90%]">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-[15px] mb-1">AI সহকারী</p>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                আমি আপনাকে পণ্য খুঁজতে এবং তথ্য দিতে সাহায্য করতে পারি। কিছু জিজ্ঞাসা করুন!
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                        {aiQuickReplies.map((qr) => (
                            <button
                                key={qr.label}
                                onClick={() => onAiSend(qr.message)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-violet-200 bg-white text-sm font-medium text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-all duration-200 active:scale-95"
                            >
                                {qr.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div ref={aiMessagesEndRef} />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {aiMessages.map((msg, idx) => (
                <AiMessageBubble key={idx} msg={msg} />
            ))}
            {aiLoading && (
                <div className="flex justify-start gap-2">
                    <div className="flex-shrink-0 pt-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-sm">
                            <Bot size={14} className="text-white" />
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-violet-100 shadow-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-violet-500" />
                        <span className="text-xs text-violet-500 font-medium animate-pulse">AI is thinking...</span>
                    </div>
                </div>
            )}
            <div ref={aiMessagesEndRef} />
        </div>
    );
};

/** Single AI message bubble (user or model). */
const AiMessageBubble: React.FC<{ msg: AiChatMessage }> = ({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
            {!isUser && (
                <div className="flex-shrink-0 pt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-sm">
                        <Bot size={14} className="text-white" />
                    </div>
                </div>
            )}
            <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
                <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isUser
                            ? 'text-white rounded-br-md'
                            : 'bg-white border border-violet-100 text-gray-800 rounded-bl-md'
                    }`}
                    style={isUser ? { background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 70%, #6D28D9 100%)' } : {}}
                >
                    <p className="whitespace-pre-line break-words">{msg.text}</p>
                    {/* Legacy image support */}
                    {msg.image && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                            <img
                                src={msg.image.url}
                                alt={msg.image.alt}
                                className="w-full max-h-48 object-cover"
                                loading="lazy"
                            />
                            <div className="px-3 py-2 flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700 truncate">{msg.image.alt}</span>
                                <span className="text-xs font-bold text-violet-700">৳{msg.image.price.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    {/* Image Card — high-quality product visual with price overlay */}
                    {msg.image_card && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative group">
                            <img
                                src={msg.image_card.url}
                                alt={msg.image_card.alt}
                                className="w-full max-h-56 object-cover"
                                loading="lazy"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
                                <span className="text-white text-xs font-medium block truncate">{msg.image_card.alt}</span>
                                <span className="text-white text-sm font-bold">৳{msg.image_card.price.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    {/* Checkout Action — branded buy-now button */}
                    {msg.checkout_action && (
                        <div className="mt-3">
                            <a
                                href={msg.checkout_action.url}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-md"
                                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 60%, #6D28D9 100%)' }}
                            >
                                <ShoppingBag size={16} />
                                {msg.checkout_action.label}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
