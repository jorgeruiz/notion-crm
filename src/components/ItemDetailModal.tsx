"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageSquare, History, Edit3, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onUpdate: (pageId: string, propertyName: string, value: any, type: string) => Promise<void>;
}

export default function ItemDetailModal({
    isOpen,
    onClose,
    item,
    onUpdate,
}: ItemDetailModalProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [editingProp, setEditingProp] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<any>(null);

    useEffect(() => {
        if (isOpen && item) {
            fetchComments();
        }
    }, [isOpen, item]);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
            const response = await fetch(`/api/notion/comments?pageId=${item.id}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (err) {
            console.error("Fetch comments error:", err);
        } finally {
            setIsLoadingComments(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSendingComment(true);
        try {
            const response = await fetch("/api/notion/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId: item.id, text: newComment }),
            });
            if (response.ok) {
                setNewComment("");
                fetchComments();
            }
        } catch (err) {
            console.error("Add comment error:", err);
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleUpdateProperty = async (propName: string, type: string) => {
        try {
            await onUpdate(item.id, propName, editValue, type);
            setEditingProp(null);
        } catch (err) {
            console.error("Update property error:", err);
        }
    };

    if (!isOpen || !item) return null;

    const titleProp = Object.values(item.properties).find((p: any) => p.type === "title") as any;
    const name = titleProp?.title?.[0]?.plain_text || "Untitled";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-end">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-xl h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
                        <div>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Deal Detail</span>
                            <h2 className="text-2xl font-bold text-white line-clamp-1">{name}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        {/* Properties Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <Edit3 size={18} className="text-gray-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Properties</h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(item.properties).map(([key, prop]: [string, any]) => {
                                    if (prop.type === "title") return null;

                                    let value: any = "";
                                    let isEditable = true;

                                    if (prop.type === "number") value = prop.number;
                                    else if (prop.type === "rich_text") value = prop.rich_text?.[0]?.plain_text;
                                    else if (prop.type === "select") value = prop.select?.name;
                                    else if (prop.type === "status") value = prop.status?.name;
                                    else if (prop.type === "date") value = prop.date?.start;
                                    else if (prop.type === "phone_number") value = prop.phone_number;
                                    else if (prop.type === "email") value = prop.email;
                                    else if (prop.type === "created_time") {
                                        value = new Date(prop.created_time).toLocaleString();
                                        isEditable = false;
                                    }

                                    const isEditing = editingProp === key && isEditable;

                                    return (
                                        <div key={key} className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">{key}</label>
                                                {isEditing ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            autoFocus
                                                            type={prop.type === "number" ? "number" : "text"}
                                                            value={editValue ?? value ?? ""}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="bg-white/10 border border-emerald-500/50 rounded-lg px-3 py-1 text-sm text-white focus:outline-none w-full"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateProperty(key, prop.type)}
                                                            className="p-1 bg-emerald-600 rounded-md text-white hover:bg-emerald-500"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingProp(null)}
                                                            className="p-1 bg-white/10 rounded-md text-gray-400 hover:bg-white/20"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-200">
                                                        {value !== undefined && value !== null ? (
                                                            prop.type === "number" ? `$${value.toLocaleString()}` : value
                                                        ) : (
                                                            <span className="text-gray-600 italic">Empty</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {!isEditing && (
                                                <button
                                                    onClick={() => {
                                                        setEditingProp(key);
                                                        setEditValue(value);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Comments Section */}
                        <section className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={18} className="text-gray-500" />
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Discussion</h3>
                                </div>
                                {isLoadingComments && <Loader2 size={16} className="animate-spin text-emerald-500" />}
                            </div>

                            <div className="space-y-6 mb-8">
                                {comments.length === 0 && !isLoadingComments && (
                                    <div className="text-center py-10 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                                        <MessageSquare size={32} className="mx-auto text-gray-700 mb-3" />
                                        <p className="text-sm text-gray-500">No comments yet. Start the conversation!</p>
                                    </div>
                                )}
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                                            {comment.created_by?.name?.[0] || "?"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-white">{comment.created_by?.name || "Unknown"}</span>
                                                <span className="text-[10px] text-gray-600">
                                                    {new Date(comment.created_time).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 text-sm text-gray-300 border border-white/5">
                                                {comment.rich_text?.map((rt: any) => rt.plain_text).join("")}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Comment */}
                            <form onSubmit={handleAddComment} className="mt-auto sticky bottom-0 bg-[#0a0a0a] pt-4">
                                <div className="relative">
                                    <textarea
                                        rows={3}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Type a comment..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSendingComment || !newComment.trim()}
                                        className="absolute bottom-4 right-4 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        {isSendingComment ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
