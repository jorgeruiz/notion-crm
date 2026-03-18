"use client";

import { useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import {
    LogOut,
    RefreshCw,
    MoreHorizontal,
    Plus,
    Search,
    LayoutDashboard,
    Settings,
    Users,
    Bell,
    Loader2,
    Filter,
    Table as TableIcon,
    PieChart as ChartIcon,
    Layout,
    Phone,
    Mail,
    Calendar,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import AddDealModal from "./AddDealModal";
import ItemDetailModal from "./ItemDetailModal";
import TableView from "./TableView";
import AnalyticsView from "./AnalyticsView";

interface KanbanProps {
    initialData: any;
    dbId: string;
    onDisconnect: () => void;
}

type ViewType = "kanban" | "table" | "analytics";

export default function KanbanBoard({ initialData, dbId, onDisconnect }: KanbanProps) {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [currentView, setCurrentView] = useState<ViewType>("kanban");

    // Filtering states
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");

    const title = data.title;
    const properties = data.properties || {};

    // Find a suitable property for columns (Status or Select)
    const statusProp = Object.values(properties).find((p: any) => p.type === "status" || p.type === "select") as any;

    const statusOptions = statusProp ? (statusProp.status?.options || statusProp.select?.options || []) : [];
    const statusPropName = statusProp?.name || "";

    // Find Service property
    const serviceProp = Object.values(properties).find((p: any) =>
        p.name.toLowerCase().includes("service") ||
        p.name.toLowerCase().includes("servicio") ||
        p.type === "select" && p.name !== statusPropName
    ) as any;
    const servicePropName = serviceProp?.name;
    const serviceOptions = serviceProp?.select?.options || [];

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/notion/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ databaseId: dbId }),
            });
            const newData = await response.json();
            if (response.ok) setData(newData);
        } catch (err) {
            console.error("Refresh error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDeal = async (dealData: any) => {
        try {
            const response = await fetch("/api/notion/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dealData),
            });

            if (response.ok) {
                await refreshData();
            } else {
                const error = await response.json();
                alert(`Error creating deal: ${error.error}`);
            }
        } catch (err) {
            console.error("Create deal error:", err);
            alert("Failed to create deal");
        }
    };

    const handleDeleteDeal = async (pageId: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const response = await fetch("/api/notion/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId }),
            });

            if (response.ok) {
                await refreshData();
            } else {
                const error = await response.json();
                alert(`Error deleting record: ${error.error}`);
            }
        } catch (err) {
            console.error("Delete deal error:", err);
            alert("Failed to delete record");
        }
    };

    const updateItemStatus = async (pageId: string, newStatus: string) => {
        // Optimistic update
        const previousItems = [...data.items];
        const propertyType = statusProp?.type;

        const updatedItems = data.items.map((item: any) => {
            if (item.id === pageId) {
                return {
                    ...item,
                    properties: {
                        ...item.properties,
                        [statusPropName]: {
                            ...item.properties[statusPropName],
                            [propertyType]: { name: newStatus }
                        }
                    }
                };
            }
            return item;
        });

        setData({ ...data, items: updatedItems });

        try {
            const response = await fetch("/api/notion/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId,
                    statusPropertyName: statusPropName,
                    statusValue: newStatus,
                    propertyType // Send this to API so it knows if it's status or select
                }),
            });

            if (!response.ok) {
                // Rollback on error
                setData({ ...data, items: previousItems });
                alert("Failed to update in Notion");
            }
        } catch (err) {
            setData({ ...data, items: previousItems });
        }
    };

    const handleUpdateProperty = async (pageId: string, propertyName: string, value: any, type: string) => {
        // Find existing item value for rollback
        const previousItems = [...data.items];

        // Optimistic update
        const updatedItems = data.items.map((item: any) => {
            if (item.id === pageId) {
                let formattedValue = value;
                if (type === "number") formattedValue = parseFloat(value);

                return {
                    ...item,
                    properties: {
                        ...item.properties,
                        [propertyName]: {
                            ...item.properties[propertyName],
                            [type]: type === "status" || type === "select" ? { name: value } :
                                type === "number" ? formattedValue :
                                    type === "rich_text" ? [{ text: { content: value } }] : value
                        }
                    }
                };
            }
            return item;
        });

        setData({ ...data, items: updatedItems });

        try {
            const response = await fetch("/api/notion/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageId,
                    statusPropertyName: propertyName,
                    statusValue: value,
                    propertyType: type
                }),
            });

            if (!response.ok) {
                setData({ ...data, items: previousItems });
                alert("Failed to update in Notion");
            }
        } catch (err) {
            setData({ ...data, items: previousItems });
        }
    };

    const getItemName = (item: any) => {
        // Find the property that has the title
        const titleProp = Object.values(item.properties).find((p: any) => p.type === "title") as any;
        return titleProp?.title?.[0]?.plain_text || "Untitled";
    };

    const filteredItems = (data.items || []).filter((item: any) => {
        const itemName = getItemName(item);
        const nameMatch = itemName.toLowerCase().includes(searchTerm.toLowerCase());

        const status = item.properties[statusPropName]?.status?.name || item.properties[statusPropName]?.select?.name;
        const statusMatch = statusFilter === "all" || status === statusFilter;

        const service = servicePropName ? item.properties[servicePropName]?.select?.name : null;
        const serviceMatch = serviceFilter === "all" || service === serviceFilter;

        return nameMatch && statusMatch && serviceMatch;
    });

    return (
        <div className="fixed inset-0 flex bg-[#050505] text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col p-6 hidden lg:flex">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <LayoutDashboard size={18} />
                    </div>
                    <span className="font-bold text-xl tracking-tight">CRM Sync</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem
                        icon={<Layout size={18} />}
                        label="Kanban Board"
                        active={currentView === "kanban"}
                        onClick={() => setCurrentView("kanban")}
                    />
                    <SidebarItem
                        icon={<TableIcon size={18} />}
                        label="Table View"
                        active={currentView === "table"}
                        onClick={() => setCurrentView("table")}
                    />
                    <SidebarItem
                        icon={<ChartIcon size={18} />}
                        label="Analytics"
                        active={currentView === "analytics"}
                        onClick={() => setCurrentView("analytics")}
                    />
                    <div className="pt-6 pb-2 px-4">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Management</span>
                    </div>
                    <SidebarItem icon={<Users size={18} />} label="Contacts" />
                    <SidebarItem icon={<Bell size={18} />} label="Notifications" />
                    <SidebarItem icon={<Settings size={18} />} label="Settings" />
                </nav>

                <button
                    onClick={onDisconnect}
                    className="mt-auto flex items-center gap-2 text-gray-500 hover:text-white transition-colors p-2 text-sm font-medium"
                >
                    <LogOut size={16} />
                    Disconnect
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md z-20">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <button
                            onClick={refreshData}
                            disabled={isLoading}
                            className={cn(
                                "p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400",
                                isLoading && "animate-spin text-blue-500"
                            )}
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search deals..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-64 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} />
                            Add Deal
                        </button>
                    </div>
                </header>

                {/* Filter Bar */}
                <div className="h-14 border-b border-white/5 px-8 flex items-center gap-6 bg-black/20 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <Filter size={14} />
                        Filters:
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-600 font-bold uppercase">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                        >
                            <option value="all">All Statuses</option>
                            {statusOptions.map((opt: any) => (
                                <option key={opt.id} value={opt.name}>{opt.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Service Filter */}
                    {servicePropName && (
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] text-gray-600 font-bold uppercase">Service</label>
                            <select
                                value={serviceFilter}
                                onChange={(e) => setServiceFilter(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                            >
                                <option value="all">All Services</option>
                                {serviceOptions.map((opt: any) => (
                                    <option key={opt.id} value={opt.name}>{opt.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {currentView === "kanban" && (
                        <div className="h-full overflow-x-auto p-8 bg-[#080808]">
                            <div className="flex h-full gap-6 min-w-max">
                                {statusOptions.map((status: any) => (
                                    <KanbanColumn
                                        key={status.id}
                                        status={status}
                                        items={filteredItems.filter((item: any) =>
                                            item.properties[statusPropName]?.status?.name === status.name ||
                                            item.properties[statusPropName]?.select?.name === status.name
                                        )}
                                        onDrop={(pageId) => updateItemStatus(pageId, status.name)}
                                        onCardClick={(item) => setSelectedItem(item)}
                                        onDelete={handleDeleteDeal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === "table" && (
                        <div className="h-full px-8 bg-[#080808]">
                            <TableView
                                items={filteredItems}
                                properties={properties}
                                onCardClick={(item) => setSelectedItem(item)}
                            />
                        </div>
                    )}

                    {currentView === "analytics" && (
                        <div className="h-full px-8 bg-[#080808]">
                            <AnalyticsView items={data.items || []} properties={properties} />
                        </div>
                    )}
                </div>
            </div>

            <AddDealModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleCreateDeal}
                properties={properties}
                dataSourceId={data.dataSourceId}
            />

            <ItemDetailModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
                onUpdate={handleUpdateProperty}
            />
        </div>
    );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all",
                active ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

function KanbanColumn({ status, items, onDrop, onCardClick, onDelete }: { status: any, items: any[], onDrop: (id: string) => void, onCardClick: (item: any) => void, onDelete: (id: string) => void }) {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const id = e.dataTransfer.getData("itemId");
        if (id) onDrop(id);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "w-80 flex flex-col rounded-2xl transition-colors",
                isOver ? "bg-white/[0.03]" : ""
            )}
        >
            <div className="flex items-center justify-between px-3 py-4 mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        status.color === "blue" ? "bg-blue-500" :
                            status.color === "purple" ? "bg-purple-500" :
                                status.color === "pink" ? "bg-pink-500" :
                                    status.color === "green" ? "bg-emerald-500" :
                                        status.color === "yellow" ? "bg-amber-500" :
                                            status.color === "orange" ? "bg-orange-500" :
                                                status.color === "red" ? "bg-red-500" : "bg-gray-500"
                    )} />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">{status.name}</h3>
                    <span className="bg-white/5 text-gray-500 text-xs px-2 py-0.5 rounded-full border border-white/5">
                        {items.length}
                    </span>
                </div>
                <button className="text-gray-600 hover:text-white transition-colors">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            <div className="flex-1 space-y-4 px-1 pb-4">
                {items.map((item: any) => (
                    <KanbanCard key={item.id} item={item} onClick={() => onCardClick(item)} onDelete={onDelete} />
                ))}
                {items.length === 0 && !isOver && (
                    <div className="h-24 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-gray-600 text-sm">
                        No items here
                    </div>
                )}
            </div>
        </div>
    );
}

function KanbanCard({ item, onClick, onDelete }: { item: any, onClick: () => void, onDelete: (id: string) => void }) {
    // Robust title extraction
    const titleProp = Object.values(item.properties).find((p: any) => p.type === "title") as any;
    const name = titleProp?.title?.[0]?.plain_text || "Untitled";

    const price = item.properties.Price?.number || item.properties.Value?.number;
    const company = item.properties.Company?.rich_text?.[0]?.plain_text;

    // New tracked fields
    const phone = item.properties.Telefono?.phone_number || item.properties.Phone?.phone_number;
    const email = item.properties.Correo?.email || item.properties.Email?.email;
    const createdAt = item.created_time ? new Date(item.created_time).toLocaleDateString() : null;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("itemId", item.id);
    };

    return (
        <motion.div
            layoutId={item.id}
            draggable
            onDragStart={handleDragStart as any}
            onClick={onClick}
            className="glass-card p-4 rounded-2xl cursor-pointer hover:border-white/20 transition-all group group-active:scale-95 shadow-lg shadow-black/20"
            whileHover={{ y: -2 }}
        >
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                    {name}
                </h4>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 rounded-lg transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {company && (
                    <div className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {company}
                    </div>
                )}
                {createdAt && (
                    <div className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1">
                        <Calendar size={10} />
                        {createdAt}
                    </div>
                )}
            </div>

            <div className="space-y-1.5 mb-4">
                {phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Phone size={12} className="text-blue-500/70" />
                        {phone}
                    </div>
                )}
                {email && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Mail size={12} className="text-purple-500/70" />
                        <span className="truncate">{email}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[#080808] bg-gradient-to-br from-gray-700 to-gray-800" />
                    ))}
                </div>
                {price !== undefined && (
                    <div className="text-sm font-bold text-green-400">
                        ${price.toLocaleString()}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
