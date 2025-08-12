from typing import Annotated
from langchain_core.tools import StructuredTool, ToolException, tool
import aiohttp
import re
from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession, Tool, McpError


def create_langchain_mcp_tool(
    mcp_tool: Tool, mcp_server_url: str = "", headers: dict[str, str] | None = None
) -> StructuredTool:
    """Create a LangChain tool from an MCP tool."""

    @tool(
        mcp_tool.name,
        description=mcp_tool.description,
        args_schema=mcp_tool.inputSchema,
    )
    async def new_tool(**kwargs):
        """Dynamically created MCP tool."""
        async with streamablehttp_client(mcp_server_url, headers=headers) as streams:
            read_stream, write_stream, _ = streams
            async with ClientSession(read_stream, write_stream) as tool_session:
                await tool_session.initialize()
                return await tool_session.call_tool(mcp_tool.name, arguments=kwargs)

    return new_tool


def wrap_mcp_authenticate_tool(tool: StructuredTool) -> StructuredTool:
    """Wrap the tool coroutine to handle `interaction_required` MCP error.

    Tried to obtain the URL from the error, which the LLM can use to render a link."""

    old_coroutine = tool.coroutine

    async def wrapped_mcp_coroutine(**kwargs):
        def _find_first_mcp_error_nested(exc: BaseException) -> McpError | None:
            if isinstance(exc, McpError):
                return exc
            if isinstance(exc, ExceptionGroup):
                for sub_exc in exc.exceptions:
                    if found := _find_first_mcp_error_nested(sub_exc):
                        return found
            return None

        try:
            return await old_coroutine(**kwargs)
        except BaseException as e_orig:
            mcp_error = _find_first_mcp_error_nested(e_orig)

            if not mcp_error:
                raise e_orig

            error_details = mcp_error.error
            is_interaction_required = getattr(error_details, "code", None) == -32003
            error_data = getattr(error_details, "data", None) or {}

            if is_interaction_required:
                message_payload = error_data.get("message", {})
                error_message_text = "Required interaction"
                if isinstance(message_payload, dict):
                    error_message_text = (
                        message_payload.get("text") or error_message_text
                    )

                if url := error_data.get("url"):
                    error_message_text = f"{error_message_text} {url}"
                raise ToolException(error_message_text) from e_orig

            raise e_orig

    tool.coroutine = wrapped_mcp_coroutine
    return tool


async def create_rag_tool(
    rag_url: str, 
    workspace: str = "",
    query_mode: str = "hybrid",
    top_k: int = 60,
    chunk_top_k: int = 6,
    max_entity_tokens: int = 4000,
    max_relation_tokens: int = 4000,
    min_rerank_score: float = 0.0,
    api_key: str = None
):
    """Create a RAG tool for LightRAG.

    Args:
        rag_url: The base URL for the LightRAG API server
        workspace: The workspace for data isolation
        query_mode: Query mode (naive, local, global, hybrid)
        top_k: Number of entities/relations to retrieve
        chunk_top_k: Maximum number of chunks in context
        max_entity_tokens: Maximum tokens for entity context
        max_relation_tokens: Maximum tokens for relation context
        min_rerank_score: Minimum rerank score threshold
        api_key: The API key for LightRAG authentication

    Returns:
        A structured tool that can be used to query the LightRAG knowledge graph
    """
    if rag_url.endswith("/"):
        rag_url = rag_url[:-1]

    @tool
    async def lightrag_search(
        query: Annotated[str, "The search query to find relevant information from the knowledge graph"],
    ) -> str:
        """Search the knowledge graph using LightRAG for relevant information."""

        search_endpoint = f"{rag_url}/query"
        payload = {
            "query": query,
            "mode": query_mode,
            "workspace": workspace,
            "top_k": top_k,
            "chunk_top_k": chunk_top_k,
            "max_entity_tokens": max_entity_tokens,
            "max_relation_tokens": max_relation_tokens,
            "min_rerank_score": min_rerank_score
        }

        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Content-Type": "application/json"}
                
                # Add authentication if API key is provided
                if api_key:
                    headers["X-API-Key"] = api_key
                
                async with session.post(
                    search_endpoint,
                    json=payload,
                    headers=headers,
                ) as search_response:
                    if search_response.status == 401:
                        if api_key:
                            return "Authentication failed. The provided API key may be incorrect or expired. Please check your LightRAG API key configuration."
                        else:
                            return "Authentication required. Please set the API key in your RAG configuration. The LightRAG server is configured to require authentication."
                    
                    search_response.raise_for_status()
                    result = await search_response.json()
                    
                    # LightRAG returns a response field with the generated answer
                    return result.get("response", "No response received from LightRAG")
        except aiohttp.ClientError as e:
            return f"Connection error to LightRAG server: {str(e)}. Please check that the LightRAG server is running at {rag_url}"
        except Exception as e:
            return f"Error querying knowledge graph: {str(e)}"

    return lightrag_search
