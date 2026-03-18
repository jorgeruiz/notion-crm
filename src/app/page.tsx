"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, ArrowRight, Kanban, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  const [databaseId, setDatabaseId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dbData, setDbData] = useState<any>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!databaseId.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/notion/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseId }),
      });

      const data = await response.json();

      if (response.ok) {
        setDbData(data);
        setIsConnected(true);
      } else {
        setError(data.error || "Failed to connect to Notion");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please check your Database ID.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 bg-[#050505]">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 blur-[120px] rounded-full" />

      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="z-10 w-full max-w-xl"
          >
            <div className="text-center mb-12 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-32 md:w-40 h-auto flex items-center justify-center mx-auto mb-8"
              >
                <img src="/logo.png" alt="Click Society Logo" className="w-full h-auto object-contain drop-shadow-2xl" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                Click Society <span className="gradient-text text-emerald-500">Notion - CRM</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Actualiza el listado de prospectos generados de tus campañas con Click Society. Mientras más información tengamos, más datos tienes para mejorar tu operación y tus ventas.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl">
              <form onSubmit={handleConnect} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">
                    Database ID
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                      <Database size={18} />
                    </div>
                    <input
                      type="text"
                      value={databaseId}
                      onChange={(e) => setDatabaseId(e.target.value)}
                      placeholder="Enter your database ID..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <p className="text-xs text-gray-500 ml-1">
                    You can find this in your database URL: <code>notion.so/workspace/[database_id]?v=...</code>
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Connect Database
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-500" /> Secure Integration
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-500" /> Real-time Sync
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="board"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="z-10 w-full h-full flex flex-col"
          >
            <KanbanBoard
              initialData={dbData}
              dbId={databaseId}
              onDisconnect={() => setIsConnected(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
