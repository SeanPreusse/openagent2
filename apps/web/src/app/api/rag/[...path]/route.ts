import { NextRequest } from "next/server";

export const runtime = "edge";

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || "http://rag:9621";

/**
 * Proxies requests from the client to the RAG server.
 * This allows the browser to access the RAG service through server-side requests.
 */
async function proxyToRag(req: NextRequest): Promise<Response> {
  try {
    // Extract the path after '/api/rag/'
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/rag/, "");
    
    // Filter out the 'path' query parameters added by Next.js [...path] route
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete('path');
    const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';

    // Construct the target URL - ensure we build the path correctly
    const targetUrl = `${RAG_API_URL}${path}${cleanSearch}`;
    console.log(`[RAG Proxy] ${req.method} ${req.url} -> ${targetUrl}`);
    console.log(`[RAG Proxy] Headers:`, Object.fromEntries(req.headers.entries()));
    console.log(`[RAG Proxy] User-Agent:`, req.headers.get('user-agent'));
    
    // Prepare headers
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Skip host header to avoid conflicts
      if (key.toLowerCase() !== "host") {
        headers.append(key, value);
      }
    });

    // Determine body based on method
    let body: BodyInit | null = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = req.body;
    }

    // Make the proxied request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    console.log(`[RAG Proxy] Response status: ${response.status}`);
    console.log(`[RAG Proxy] Response headers:`, Object.fromEntries(response.headers.entries()));
    
    // Get response text to check if it's HTML or JSON
    const responseText = await response.text();
    console.log(`[RAG Proxy] Response body preview:`, responseText.substring(0, 100));

    // Create response with CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("[RAG Proxy] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to connect to RAG service",
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyToRag(req);
}

export async function POST(req: NextRequest) {
  return proxyToRag(req);
}

export async function PUT(req: NextRequest) {
  return proxyToRag(req);
}

export async function DELETE(req: NextRequest) {
  return proxyToRag(req);
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
