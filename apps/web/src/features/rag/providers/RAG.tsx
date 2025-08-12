import React, { createContext, useContext, PropsWithChildren } from "react";
import { Collection } from "@/types/collection";
import { Document } from "@langchain/core/documents";

// Simplified RAG context for LightRAG (no collections concept)
interface SimplifiedRagContextType {
  collections: Collection[];
  documents: Document[];
  selectedCollection: Collection | undefined;
  setSelectedCollection: (collection: Collection | undefined) => void;
  initialSearchExecuted: boolean;
  collectionsLoading: boolean;
  documentsLoading: boolean;
  // Add other properties that legacy components might expect
  createCollection: () => Promise<Collection | undefined>;
  deleteCollection: () => Promise<string | undefined>;
  deleteDocument: () => Promise<void>;
  handleFileUpload: () => Promise<void>;
  handleTextUpload: () => Promise<void>;
}

const RagContext = createContext<SimplifiedRagContextType | null>(null);

export const RagProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Since LightRAG doesn't use collections, provide empty/mock data for backward compatibility
  const mockRagState: SimplifiedRagContextType = {
    collections: [], // Empty since LightRAG doesn't use collections
    documents: [],
    selectedCollection: undefined,
    setSelectedCollection: () => {},
    initialSearchExecuted: true, // Always true since no initialization needed
    collectionsLoading: false,
    documentsLoading: false,
    createCollection: async () => undefined,
    deleteCollection: async () => undefined,
    deleteDocument: async () => {},
    handleFileUpload: async () => {},
    handleTextUpload: async () => {},
  };

  return <RagContext.Provider value={mockRagState}>{children}</RagContext.Provider>;
};

export const useRagContext = () => {
  const context = useContext(RagContext);
  if (context === null) {
    throw new Error("useRagContext must be used within a RagProvider");
  }
  return context;
};

export type { SimplifiedRagContextType as RagContextType };
