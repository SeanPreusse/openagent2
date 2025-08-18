import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

// LightRAG API Types
interface LightRAGDocument {
  id: string;
  content_summary: string;
  content_length: number;
  status: "processed" | "processing" | "failed";
  created_at: string;
  updated_at: string;
  track_id?: string;
  chunks_count: number;
  error_msg?: string;
  file_path: string;
  metadata?: Record<string, any>;
}

interface LightRAGDocumentsResponse {
  statuses: {
    processed: LightRAGDocument[];
    processing?: LightRAGDocument[];
    failed?: LightRAGDocument[];
  };
}

interface LightRAGUploadResponse {
  status: "success" | "duplicated" | "error";
  message: string;
  track_id?: string;
}

interface LightRAGQueryResponse {
  response: string;
}

interface LightRAGHealthResponse {
  status: string;
  working_directory: string;
  input_directory: string;
  configuration: Record<string, any>;
}

function getApiUrlOrThrow(): URL {
  // Use the proxy API route instead of direct connection to RAG service
  // Handle both client-side and server-side rendering
  if (typeof window !== 'undefined') {
    return new URL("/api/rag", window.location.origin);
  } else {
    // Server-side fallback - this shouldn't be called during SSR but just in case
    return new URL("/api/rag", "http://localhost:3000");
  }
}

export function useLightRAG() {
  const [documents, setDocuments] = useState<LightRAGDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState<string[]>([]); // Still used for UI indicators
  const [updateTrigger, setUpdateTrigger] = useState(0);
  // Removed complex pending uploads - keeping it simple

  // Get health status
  const getHealth = useCallback(async (): Promise<LightRAGHealthResponse | null> => {
    try {
      const url = `${window.location.origin}/api/rag/health`;
      console.log(`🔧 Making health check request to: ${url}`);
      const response = await fetch(url);
      console.log(`🔧 Health response status: ${response.status}`);
      console.log(`🔧 Health response URL: ${response.url}`);
      console.log(`🔧 Health response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`🔧 Health error response body:`, errorText.substring(0, 200));
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error checking health:", error);
      toast.error("Failed to connect to LightRAG server");
      return null;
    }
  }, []);

  // List all documents
  const listDocuments = useCallback(async (): Promise<LightRAGDocument[]> => {
    setDocumentsLoading(true);
    try {
      const url = `${window.location.origin}/api/rag/documents`;
      console.log(`🔧 Making documents request to: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store'
      });
      
      console.log(`🔧 Documents response status: ${response.status}`);
      console.log(`🔧 Documents response URL: ${response.url}`);
      console.log(`🔧 Documents response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`🔧 Documents error response body:`, errorText.substring(0, 200));
        console.error(`❌ Response not ok: ${response.status} ${response.statusText}`); // Debug: Error details
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const data: LightRAGDocumentsResponse = await response.json();
      // console.log(`📄 Raw response data:`, data); // Debug: Show raw response (disabled)
      // console.log(`📄 Raw response JSON:`, JSON.stringify(data, null, 2)); // Debug: Show as JSON string (disabled)
      // console.log(`📄 Statuses object:`, data.statuses); // Debug: Show statuses specifically (disabled)
      // console.log(`📄 Processed array:`, data.statuses?.processed); // Debug: Show processed array (disabled)
      // console.log(`📄 Processing array:`, data.statuses?.processing); // Debug: Show processing array (disabled)
      const allDocs = [
        ...(data.statuses.processed || []),
        ...(data.statuses.processing || []),
        ...(data.statuses.failed || []),
      ];
      
      // Debug: Show what the server actually returned
      console.log(`🔍 Server response:`, {
        processed: data.statuses.processed?.length || 0,
        processing: data.statuses.processing?.length || 0, 
        failed: data.statuses.failed?.length || 0,
        total: allDocs.length
      });
      
      // Track processing documents for auto-refresh
      const currentProcessing = (data.statuses.processing || []).map(doc => doc.id);
      setProcessingDocuments([...currentProcessing]); // Force new array
      
      console.log(`📊 Hook: Setting ${allDocs.length} documents, trigger: ${updateTrigger + 1}`);
      setDocuments([...allDocs]); // Simple - just show server documents
      setUpdateTrigger(prev => prev + 1); // Force component re-render
      return allDocs;
    } catch (error) {
      console.error("❌ Error fetching documents:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
      toast.error(`Failed to fetch documents: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  // Smart completion check with status polling
  const checkUploadComplete = useCallback(async (trackId: string, maxAttempts: number = 10): Promise<void> => {
    try {
      const url = getApiUrlOrThrow();
      url.pathname = `/documents/track_status/${trackId}`;
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      console.log(`🔍 Track ${trackId} status:`, data.status_summary);
      
      const isComplete = data.status_summary?.processed > 0 && !data.status_summary?.processing;
      const isStillProcessing = data.status_summary?.processing > 0;
      
      if (isComplete) {
        console.log(`✅ Upload ${trackId} completed - refreshing UI`);
        await listDocuments(); // Refresh to show processed document
      } else if (isStillProcessing && maxAttempts > 0) {
        console.log(`⏳ Upload ${trackId} still processing - checking again in 2s (${maxAttempts} attempts left)`);
        // Keep checking if still processing
        setTimeout(() => checkUploadComplete(trackId, maxAttempts - 1), 2000);
      } else {
        console.log(`❓ Upload ${trackId} status unclear, refreshing anyway`);
        await listDocuments(); // Refresh in case something changed
      }
    } catch (error) {
      console.error(`❌ Error checking upload ${trackId}:`, error);
    }
  }, [listDocuments]);

  // Upload file
  const uploadFile = useCallback(async (file: File): Promise<LightRAGUploadResponse | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const url = `${window.location.origin}/api/rag/documents/upload`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result: LightRAGUploadResponse = await response.json();
      
      if (result.status === "success") {
        console.log(`📤 File upload successful: ${file.name}`);
        
        // Smart refresh strategy: multiple attempts to catch the document
        console.log(`🔄 Starting smart refresh for ${file.name}`);
        
        // Immediate refresh (might be too early)
        await listDocuments();
        
        // Try again after 1 second (document might appear)
        setTimeout(async () => {
          console.log(`🔄 Refresh attempt 1s for ${file.name}`);
          await listDocuments();
        }, 1000);
        
        // Final check after 3 seconds for completion
        if (result.track_id) {
          setTimeout(async () => {
            await checkUploadComplete(result.track_id!);
          }, 3000);
        }
        
      } else if (result.status === "duplicated") {
        toast.warning(result.message);
      }
      
      return result;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload file: ${error}`);
      return null;
    } finally {
      setUploading(false);
    }
  }, [listDocuments]);

  // Upload text as document
  const uploadText = useCallback(async (text: string, filename?: string): Promise<LightRAGUploadResponse | null> => {
    setUploading(true);
    try {
      const payload = {
        text,
        filename: filename || `text_document_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`,
      };
      
      const url = `${window.location.origin}/api/rag/documents/text`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Text upload failed: ${response.statusText}`);
      }
      
      const result: LightRAGUploadResponse = await response.json();
      
      if (result.status === "success") {
        console.log(`📤 Text upload successful: ${payload.filename}`);
        
        // Smart refresh strategy: multiple attempts to catch the document
        console.log(`🔄 Starting smart refresh for ${payload.filename}`);
        
        // Immediate refresh (might be too early)
        await listDocuments();
        
        // Try again after 1 second (document might appear)
        setTimeout(async () => {
          console.log(`🔄 Refresh attempt 1s for ${payload.filename}`);
          await listDocuments();
        }, 1000);
        
        // Final check after 3 seconds for completion
        if (result.track_id) {
          setTimeout(async () => {
            await checkUploadComplete(result.track_id!);
          }, 3000);
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error uploading text:", error);
      toast.error(`Failed to upload text: ${error}`);
      return null;
    } finally {
      setUploading(false);
    }
  }, [listDocuments]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      const url = getApiUrlOrThrow();
      url.pathname = `/documents/delete_document`;
      
      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          doc_ids: [documentId],
          delete_file: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      toast.success("Document deletion initiated. Processing in background...");
      // Refresh documents list
      setTimeout(() => listDocuments(), 1000); // Give the server a moment to process
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(`Failed to delete document: ${error}`);
      return false;
    }
  }, [listDocuments]);

  // Query the knowledge graph
  const query = useCallback(async (
    queryText: string, 
    mode: "naive" | "local" | "global" | "hybrid" = "hybrid"
  ): Promise<string | null> => {
    setQuerying(true);
    try {
      const payload = {
        query: queryText,
        mode,
      };
      
      const url = `${window.location.origin}/api/rag/query`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }
      
      const result: LightRAGQueryResponse = await response.json();
      return result.response;
    } catch (error) {
      console.error("Error querying:", error);
      toast.error(`Query failed: ${error}`);
      return null;
    } finally {
      setQuerying(false);
    }
  }, []);

  // Clear all documents
  const clearDocuments = useCallback(async (): Promise<boolean> => {
    try {
      const url = `${window.location.origin}/api/rag/documents`;
      const response = await fetch(url, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Clear failed: ${response.statusText}`);
      }
      
      toast.success("All documents cleared successfully");
      setDocuments([]);
      return true;
    } catch (error) {
      console.error("Error clearing documents:", error);
      toast.error(`Failed to clear documents: ${error}`);
      return false;
    }
  }, []);

  // No more complex polling - just simple completion checks

  return {
    // State
    documents,
    documentsLoading,
    uploading,
    querying,
    processingDocuments,
    updateTrigger,
    
    // Actions
    getHealth,
    listDocuments,
    uploadFile,
    uploadText,
    deleteDocument,
    query,
    clearDocuments,
  };
}
