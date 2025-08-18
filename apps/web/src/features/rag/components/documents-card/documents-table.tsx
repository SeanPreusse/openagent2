"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, MoreVertical } from "lucide-react";
import { Document } from "@langchain/core/documents";
import { useRagContext } from "../../providers/RAG";
import { format } from "date-fns";
import { Collection } from "@/types/collection";
import { getCollectionName } from "../../hooks/use-rag";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Table as UiTable, TableBody as UiTBody, TableCell as UiTCell, TableHead as UiTHead, TableHeader as UiTHeader, TableRow as UiTRow } from "@/components/ui/table";
import React from "react";

interface DocumentsTableProps {
  documents: Document[];
  selectedCollection: Collection;
  actionsDisabled: boolean;
}

export function DocumentsTable({
  documents,
  selectedCollection,
  actionsDisabled,
}: DocumentsTableProps) {
  const { deleteDocument } = useRagContext();
  const [selectedDocDetails, setSelectedDocDetails] = useState<any | null>(null);
  const [chunks, setChunks] = useState<Array<{ index: number; content: string }> | null>(null);

  async function openDetails(doc: Document) {
    try {
      const base = `/api/rag`;
      const id = doc.metadata.file_id ?? doc.id;
      const res = await fetch(`${base}/documents/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSelectedDocDetails(data);
      // fetch chunks
      const cres = await fetch(`${base}/documents/${id}/chunks`);
      if (cres.ok) {
        const cdata = await cres.json();
        setChunks(
          Array.isArray(cdata)
            ? cdata.map((c: any) => ({ index: c.index ?? c.idx ?? 0, content: c.content ?? "" }))
            : [],
        );
      } else {
        setChunks([]);
      }
    } catch (e) {
      setSelectedDocDetails({ error: String(e) });
      setChunks([]);
    }
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document Name</TableHead>
          <TableHead>Collection</TableHead>
          <TableHead>Date Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-muted-foreground text-center"
            >
              No documents found in this collection.
            </TableCell>
          </TableRow>
        ) : (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="underline" onClick={() => openDetails(doc)}>
                      {doc.metadata.name}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Document Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                      <pre className="text-[11px] whitespace-pre-wrap break-words p-3 bg-muted rounded">{JSON.stringify(selectedDocDetails ?? doc, null, 2)}</pre>
                      {selectedDocDetails?.metadata?.num_chunks !== undefined && (
                        <p className="text-[11px] text-muted-foreground">Total chunks: {selectedDocDetails.metadata.num_chunks}</p>
                      )}
                      <div>
                        <h4 className="font-semibold mb-2">Chunks</h4>
                        {chunks && chunks.length > 0 ? (
                          <UiTable>
                            <UiTHeader>
                              <UiTRow>
                                <UiTHead className="w-14">#</UiTHead>
                                <UiTHead>Content</UiTHead>
                              </UiTRow>
                            </UiTHeader>
                            <UiTBody>
                              {chunks.map((c, i) => (
                                <UiTRow key={i}>
                                  <UiTCell className="align-top w-14 text-[11px]">{c.index}</UiTCell>
                                  <UiTCell className="whitespace-pre-wrap break-words">
                                    <ChunkPreview content={c.content} />
                                  </UiTCell>
                                </UiTRow>
                              ))}
                            </UiTBody>
                          </UiTable>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">No chunks found.</p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {getCollectionName(selectedCollection.name)}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(doc.metadata.created_at), "MM/dd/yyyy h:mm a")}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={actionsDisabled}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the document
                        <span className="font-semibold">
                          {" "}
                          {doc.metadata.name}
                        </span>
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () =>
                          await deleteDocument(doc.metadata.file_id)
                        }
                        className="bg-destructive hover:bg-destructive/90 text-white"
                        disabled={actionsDisabled}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function ChunkPreview({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const truncated = content.length > 300 ? content.slice(0, 300) + "…" : content;
  return (
    <div className="text-[11px] leading-snug">
      <pre className="whitespace-pre-wrap break-words m-0">
        {expanded ? content : truncated}
      </pre>
      {content.length > 300 && (
        <button
          type="button"
          className="mt-1 text-[11px] underline text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
