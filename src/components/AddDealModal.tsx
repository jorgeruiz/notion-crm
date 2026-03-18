"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2 } from "lucide-react";

interface AddDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: any) => Promise<void>;
    properties: any;
    dataSourceId: string;
}

export default function AddDealModal({
    isOpen,
    onClose,
    onAdd,
    properties,
    dataSourceId,
}: AddDealModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Get status options for default value
    const statusProp = Object.values(properties).find((p: any) => p.type === "status" || p.type === "select") as any;
    const statusPropName = statusProp?.name;
    const statusOptions = statusProp ? (statusProp.status?.options || statusProp.select?.options || []) : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Find the Name property (title)
            const nameProp = Object.values(properties).find((p: any) => p.type === "title") as any;
            const namePropName = nameProp?.name || "Name";

            const formattedProperties: any = {
                [namePropName]: {
                    title: [
                        {
                            text: {
                                content: formData[namePropName] || "New Deal",
                            },
                        },
                    ],
                },
            };

            // Add status if selected
            if (statusPropName && formData[statusPropName]) {
                formattedProperties[statusPropName] = {
                    [statusProp.type]: {
                        name: formData[statusPropName],
                    },
                };
            }

            // Add other properties (simplified for now: Price as number, Company as rich_text)
            Object.entries(properties).forEach(([key, prop]: [string, any]) => {
                if (key === namePropName || key === statusPropName) return;
                if (!formData[key]) return;

                if (prop.type === "number") {
                    formattedProperties[key] = { number: parseFloat(formData[key]) };
                } else if (prop.type === "rich_text") {
                    formattedProperties[key] = {
                        rich_text: [{ text: { content: formData[key] } }],
                    };
                } else if (prop.type === "select") {
                    formattedProperties[key] = { select: { name: formData[key] } };
                } else if (prop.type === "phone_number") {
                    formattedProperties[key] = { phone_number: formData[key] };
                } else if (prop.type === "email") {
                    formattedProperties[key] = { email: formData[key] };
                } else if (prop.type === "date") {
                    formattedProperties[key] = { date: { start: formData[key] } };
                }
            });

            await onAdd({
                dataSourceId,
                properties: formattedProperties,
            });

            setFormData({});
            onClose();
        } catch (err) {
            console.error("Submit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Plus className="text-emerald-500" size={24} />
                            Add New Deal
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Find Title Property */}
                        {Object.values(properties)
                            .filter((p: any) => p.type === "title")
                            .map((p: any) => (
                                <div key={p.id} className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">
                                        {p.name}
                                    </label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        onChange={(e) => handleChange(p.name, e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                        placeholder={`Enter ${p.name.toLowerCase()}...`}
                                    />
                                </div>
                            ))}

                        {/* Status Selector */}
                        {statusProp && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">
                                    {statusProp.name}
                                </label>
                                <select
                                    onChange={(e) => handleChange(statusProp.name, e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                                >
                                    <option value="" className="bg-[#0f0f0f]">Select {statusProp.name.toLowerCase()}</option>
                                    {statusOptions.map((opt: any) => (
                                        <option key={opt.id} value={opt.name} className="bg-[#0f0f0f]">
                                            {opt.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Other common properties */}
                        <div className="grid grid-cols-2 gap-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.values(properties)
                                .filter((p: any) =>
                                    p.type !== "title" &&
                                    p.name !== statusPropName &&
                                    p.type !== "created_time" &&
                                    p.type !== "last_edited_time" &&
                                    p.type !== "formula" &&
                                    p.type !== "rollup"
                                )
                                .map((p: any) => (
                                    <div key={p.id} className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">
                                            {p.name}
                                        </label>
                                        {p.type === "select" ? (
                                            <select
                                                onChange={(e) => handleChange(p.name, e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                            >
                                                <option value="" className="bg-[#0f0f0f]">Select...</option>
                                                {p.select.options.map((opt: any) => (
                                                    <option key={opt.id} value={opt.name} className="bg-[#0f0f0f]">
                                                        {opt.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={p.type === "number" ? "number" : p.type === "date" ? "date" : "text"}
                                                step={p.type === "number" ? "any" : undefined}
                                                onChange={(e) => handleChange(p.name, e.target.value)}
                                                className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all [color-scheme:dark]"
                                                placeholder={p.name}
                                            />
                                        )}
                                    </div>
                                ))}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Plus size={20} />
                                )}
                                Create Deal
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
