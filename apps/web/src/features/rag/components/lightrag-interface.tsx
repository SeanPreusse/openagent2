"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Upload, 
  FileText, 
  Search, 
  Trash2, 
  RefreshCw, 
  Database,
  MessageSquare,
  File,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useLightRAG } from "../hooks/use-lightrag";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LightRAGInterface() {
  const {
    documents,
    documentsLoading,
    uploading,
    querying,
    processingDocuments,
    updateTrigger,
    getHealth,
    listDocuments,
    uploadFile,
    uploadText,
    deleteDocument,
    query,
    clearDocuments,
  } = useLightRAG();

  const [queryText, setQueryText] = useState("");
  const [queryMode, setQueryMode] = useState<"naive" | "local" | "global" | "hybrid">("hybrid");
  const [queryResult, setQueryResult] = useState<string>("");
  const [textInput, setTextInput] = useState("");
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Load documents and health on mount
  useEffect(() => {
    const initialize = async () => {
      await listDocuments();
      const health = await getHealth();
      setHealthStatus(health);
    };
    initialize();
  }, []); // Remove dependencies to avoid re-initialization

  // Debug: Log when documents state changes
  useEffect(() => {
    console.log(`🔄 UI Documents state updated: ${documents.length} documents (trigger: ${updateTrigger})`);
  }, [documents, updateTrigger]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let successCount = 0;
    const totalFiles = files.length;

    for (const file of Array.from(files)) {
      console.log(`🗂️ UI: Uploading file ${file.name}`);
      const result = await uploadFile(file);
      if (result?.status === "success") {
        successCount++;
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} of ${totalFiles} files uploaded successfully. Processing in background...`);
      console.log(`🔄 UI: Forcing refresh after ${successCount} successful uploads`);
      await listDocuments(); // Force refresh from UI side
    }
    
    // Reset input
    event.target.value = "";
  };

  const handleTextUpload = async () => {
    if (!textInput.trim()) return;
    
    console.log(`📝 UI: Uploading text`);
    const result = await uploadText(textInput);
    if (result?.status === "success") {
      toast.success("Text uploaded successfully. Processing in background...");
      console.log(`🔄 UI: Forcing refresh after text upload`);
      await listDocuments(); // Force refresh from UI side
    }
    setTextInput("");
  };

  const handleQuery = async () => {
    if (!queryText.trim()) return;
    
    const result = await query(queryText, queryMode);
    if (result) {
      setQueryResult(result);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Processed</Badge>;
      case "processing":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LightRAG Knowledge System</h1>
          <p className="text-muted-foreground">Upload documents, build knowledge graphs, and query your data</p>
        </div>
        <div className="flex items-center gap-2">
          {healthStatus && (
            <Badge variant="outline" className="bg-green-50">
              <Database className="w-3 h-3 mr-1" />
              {healthStatus.status}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={listDocuments} disabled={documentsLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${documentsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="query" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="query">
            <Search className="w-4 h-4 mr-2" />
            Query
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
            {uploading && (
              <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents ({documents.length})
            {processingDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                {processingDocuments.length} processing
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Query Tab */}
        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Query Knowledge Graph
              </CardTitle>
              <CardDescription>
                Ask questions about your documents and get AI-powered responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Query Mode</label>
                <Select value={queryMode} onValueChange={(value: any) => setQueryMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">Hybrid (Knowledge Graph + Vector)</SelectItem>
                    <SelectItem value="local">Local (Entity-focused)</SelectItem>
                    <SelectItem value="global">Global (Community-based)</SelectItem>
                    <SelectItem value="naive">Naive (Vector only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Question</label>
                <Textarea
                  placeholder="What would you like to know about your documents?"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleQuery} 
                disabled={querying || !queryText.trim() || documents.length === 0}
                className="w-full"
              >
                {querying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Querying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Query Knowledge Graph
                  </>
                )}
              </Button>

              {queryResult && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Response</label>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="whitespace-pre-wrap text-sm">{queryResult}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="w-5 h-5" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Upload documents to add to your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,.doc,.docx,.html"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported: TXT, MD, PDF, DOC, DOCX, HTML
                  </p>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Uploading and processing...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Upload Text
                </CardTitle>
                <CardDescription>
                  Directly input text content to add to your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your text content here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={handleTextUpload} 
                  disabled={uploading || !textInput.trim()}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Library
                </CardTitle>
                <CardDescription>
                  Manage your uploaded documents and their processing status
                </CardDescription>
              </div>
              {documents.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Documents</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all documents and their associated knowledge graph data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearDocuments}>Clear All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No documents yet</p>
                  <p>Upload some documents to get started with your knowledge base</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3" key={updateTrigger}>
                    {documents.map((doc) => (
                      <Card key={doc.id} className={`border-l-4 ${
                        doc.status === "processing" ? "border-l-yellow-500 animate-pulse" : 
                        doc.status === "processed" ? "border-l-green-500" : 
                        doc.status === "failed" ? "border-l-red-500" : "border-l-blue-500"
                      }`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{doc.file_path}</h4>
                                {getStatusBadge(doc.status)}
                                {doc.status === "processing" && (
                                  <RefreshCw className="w-3 h-3 animate-spin text-yellow-600" />
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {doc.content_summary}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {doc.content_length} chars
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {doc.chunks_count} chunks
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(doc.created_at), "MMM dd, yyyy")}
                                </span>
                              </div>
                              
                              {doc.error_msg && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                  {doc.error_msg}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocument(doc.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
