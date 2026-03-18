"use client";

import { cn } from "@/lib/utils";
import { Edit3 } from "lucide-react";

interface TableViewProps {
    items: any[];
    properties: any;
    onCardClick: (item: any) => void;
}

export default function TableView({ items, properties, onCardClick }: TableViewProps) {
    const propertyKeys = Object.keys(properties).filter(key => properties[key].type !== "title");
    const titlePropName = (Object.values(properties).find((p: any) => p.type === "title") as any)?.name || "Name";

    const renderValue = (item: any, propName: string) => {
        const prop = item.properties[propName];
        if (!prop) return <span className="text-gray-700 italic">Empty</span>;

        switch (prop.type) {
            case "number":
                return prop.number !== null ? `$${prop.number.toLocaleString()}` : "";
            case "select":
                return prop.select?.name || "";
            case "status":
                return prop.status?.name || "";
            case "rich_text":
                return prop.rich_text?.[0]?.plain_text || "";
            case "date":
                return prop.date?.start || "";
            case "phone_number":
                return prop.phone_number || "";
            case "email":
                return prop.email || "";
            default:
                return "";
        }
    };

    return (
        <div className="w-full h-full overflow-hidden flex flex-col pt-4">
            <div className="flex-1 overflow-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/20">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                        <tr className="border-b border-white/10">
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{titlePropName}</th>
                            {propertyKeys.map((key) => (
                                <th key={key} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{key}</th>
                            ))}
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {items.map((item) => (
                            <tr
                                key={item.id}
                                className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                onClick={() => onCardClick(item)}
                            >
                                <td className="p-4">
                                    <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                        {item.properties[titlePropName]?.title?.[0]?.plain_text || "Untitled"}
                                    </span>
                                </td>
                                {propertyKeys.map((key) => (
                                    <td key={key} className="p-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            {properties[key].type === "status" || properties[key].type === "select" ? (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    "bg-white/5 text-gray-400"
                                                )}>
                                                    {renderValue(item, key)}
                                                </span>
                                            ) : (
                                                renderValue(item, key)
                                            )}
                                        </div>
                                    </td>
                                ))}
                                <td className="p-4 text-right">
                                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-all">
                                        <Edit3 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
