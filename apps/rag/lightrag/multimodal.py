"""
LightRAG-RAGAnything Integration Module

This module provides seamless integration between LightRAG and RAG-Anything for multimodal
document processing capabilities, enabling support for Excel, PowerPoint, images, and other
multimodal document formats.
"""

from __future__ import annotations

import asyncio
import os
import warnings
from typing import Any, Callable, Optional, Dict, List, Union
from dataclasses import dataclass, field

from .base import QueryParam
from .utils import logger


try:
    from raganything import RAGAnything
    RAGANYTHING_AVAILABLE = True
except ImportError:
    RAGANYTHING_AVAILABLE = False
    RAGAnything = None


@dataclass
class MultimodalConfig:
    """Configuration for multimodal processing with RAG-Anything"""
    
    vision_model_func: Optional[Callable] = None
    """Vision model function for processing images and multimodal content"""
    
    enable_image_processing: bool = True
    """Enable processing of image files (PNG, JPG, JPEG, etc.)"""
    
    enable_office_processing: bool = True
    """Enable processing of Office documents (DOC, DOCX, PPT, PPTX, XLS, XLSX)"""
    
    enable_pdf_processing: bool = True
    """Enable enhanced PDF processing with image and table extraction"""
    
    output_dir: str = "./multimodal_output"
    """Directory for storing processed multimodal content"""
    
    chunk_size: int = 1000
    """Chunk size for text processing"""
    
    chunk_overlap: int = 200
    """Overlap between chunks"""
    
    image_description_prompt: str = "Describe this image in detail, focusing on any text, data, charts, or important visual elements."
    """Prompt template for describing images"""
    
    table_extraction_prompt: str = "Extract and describe the structure and content of any tables in this document."
    """Prompt template for extracting table information"""
    
    multimodal_metadata_fields: List[str] = field(default_factory=lambda: [
        "document_type", "has_images", "has_tables", "file_format", "processed_elements"
    ])
    """Additional metadata fields for multimodal documents"""


class LightRAGMultimodal:
    """
    Enhanced LightRAG class with RAG-Anything integration for multimodal document processing.
    
    This class extends LightRAG capabilities to handle Excel, PowerPoint, images, and other
    multimodal documents through RAG-Anything integration.
    """
    
    def __init__(
        self,
        lightrag_instance,
        multimodal_config: Optional[MultimodalConfig] = None,
        **kwargs
    ):
        """
        Initialize LightRAG with multimodal capabilities.
        
        Args:
            lightrag_instance: Existing LightRAG instance to enhance
            multimodal_config: Configuration for multimodal processing
            **kwargs: Additional arguments for RAG-Anything
        """
        if not RAGANYTHING_AVAILABLE:
            raise ImportError(
                "RAG-Anything is not installed. Please install it with: pip install raganything"
            )
        
        self.lightrag = lightrag_instance
        self.config = multimodal_config or MultimodalConfig()
        
        # Ensure output directory exists
        os.makedirs(self.config.output_dir, exist_ok=True)
        
        # Initialize RAG-Anything with the existing LightRAG instance
        self.rag_anything = None
        self._initialized = False
        
        logger.info("LightRAG multimodal integration initialized")
    
    async def initialize(self):
        """Initialize RAG-Anything with the LightRAG instance"""
        if self._initialized:
            return
            
        if not self.config.vision_model_func:
            warnings.warn(
                "No vision model function provided. Multimodal processing will be limited."
            )
        
        try:
            # Initialize RAG-Anything with the existing LightRAG instance
            self.rag_anything = RAGAnything(
                lightrag=self.lightrag,
                vision_model_func=self.config.vision_model_func
            )
            self._initialized = True
            logger.info("RAG-Anything successfully initialized with LightRAG")
        except Exception as e:
            logger.error(f"Failed to initialize RAG-Anything: {e}")
            raise
    
    async def process_document_complete(
        self,
        file_path: str,
        track_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process a multimodal document using RAG-Anything.
        
        Args:
            file_path: Path to the document to process
            track_id: Optional tracking ID for monitoring progress
            **kwargs: Additional processing options
            
        Returns:
            Dictionary containing processing results and metadata
        """
        if not self._initialized:
            await self.initialize()
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        try:
            # Use RAG-Anything to process the document
            result = await self.rag_anything.process_document_complete(
                file_path=file_path,
                output_dir=self.config.output_dir,
                **kwargs
            )
            
            # Add multimodal metadata
            file_ext = os.path.splitext(file_path)[1].lower()
            document_type = self._get_document_type(file_ext)
            
            metadata = {
                "document_type": document_type,
                "file_format": file_ext,
                "multimodal_processed": True,
                "track_id": track_id,
                "processing_timestamp": asyncio.get_event_loop().time()
            }
            
            if isinstance(result, dict):
                result.update(metadata)
            else:
                result = {"status": "processed", **metadata}
            
            logger.info(f"Successfully processed multimodal document: {file_path}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing multimodal document {file_path}: {e}")
            raise
    
    async def query_with_multimodal(
        self,
        query: str,
        mode: str = "hybrid",
        **kwargs
    ) -> str:
        """
        Query the knowledge base with multimodal support.
        
        Args:
            query: The query string
            mode: Query mode (hybrid, local, global, etc.)
            **kwargs: Additional query parameters
            
        Returns:
            Query response incorporating multimodal content
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            # Use RAG-Anything's multimodal query capabilities
            result = await self.rag_anything.query_with_multimodal(
                query=query,
                mode=mode,
                **kwargs
            )
            
            logger.info(f"Multimodal query processed: {query[:50]}...")
            return result
            
        except Exception as e:
            logger.error(f"Error in multimodal query: {e}")
            # Fallback to regular LightRAG query
            warnings.warn("Falling back to regular LightRAG query due to multimodal error")
            
            query_param = QueryParam(mode=mode, **kwargs)
            return await self.lightrag.aquery(query, param=query_param)
    
    async def process_image(
        self,
        image_path: str,
        description_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a single image file.
        
        Args:
            image_path: Path to the image file
            description_prompt: Custom prompt for image description
            
        Returns:
            Dictionary containing image processing results
        """
        if not self._initialized:
            await self.initialize()
        
        if not self.config.enable_image_processing:
            raise ValueError("Image processing is disabled in configuration")
        
        prompt = description_prompt or self.config.image_description_prompt
        
        try:
            # Process image using RAG-Anything
            result = await self.rag_anything.process_document_complete(
                file_path=image_path,
                output_dir=self.config.output_dir,
                custom_prompt=prompt
            )
            
            return {
                "image_path": image_path,
                "description": result.get("content", ""),
                "metadata": result.get("metadata", {}),
                "processed_at": asyncio.get_event_loop().time()
            }
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {e}")
            raise
    
    async def process_office_document(
        self,
        file_path: str,
        extract_tables: bool = True,
        extract_images: bool = True
    ) -> Dict[str, Any]:
        """
        Process Office documents (Excel, PowerPoint, Word).
        
        Args:
            file_path: Path to the Office document
            extract_tables: Whether to extract table content
            extract_images: Whether to extract embedded images
            
        Returns:
            Dictionary containing processing results
        """
        if not self._initialized:
            await self.initialize()
        
        if not self.config.enable_office_processing:
            raise ValueError("Office document processing is disabled in configuration")
        
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext not in ['.xlsx', '.xls', '.pptx', '.ppt', '.docx', '.doc']:
            raise ValueError(f"Unsupported Office document format: {file_ext}")
        
        try:
            # Process using RAG-Anything with specific options for Office docs
            result = await self.rag_anything.process_document_complete(
                file_path=file_path,
                output_dir=self.config.output_dir,
                extract_tables=extract_tables,
                extract_images=extract_images
            )
            
            return {
                "file_path": file_path,
                "document_type": self._get_document_type(file_ext),
                "content": result.get("content", ""),
                "tables": result.get("tables", []) if extract_tables else [],
                "images": result.get("images", []) if extract_images else [],
                "metadata": result.get("metadata", {}),
                "processed_at": asyncio.get_event_loop().time()
            }
            
        except Exception as e:
            logger.error(f"Error processing Office document {file_path}: {e}")
            raise
    
    def _get_document_type(self, file_ext: str) -> str:
        """Determine document type from file extension"""
        type_mapping = {
            '.pdf': 'pdf',
            '.xlsx': 'excel',
            '.xls': 'excel',
            '.pptx': 'powerpoint',
            '.ppt': 'powerpoint',
            '.docx': 'word',
            '.doc': 'word',
            '.png': 'image',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.gif': 'image',
            '.bmp': 'image',
            '.tiff': 'image',
            '.svg': 'image'
        }
        return type_mapping.get(file_ext.lower(), 'unknown')
    
    async def get_multimodal_stats(self) -> Dict[str, Any]:
        """
        Get statistics about processed multimodal content.
        
        Returns:
            Dictionary containing processing statistics
        """
        try:
            # This would need to be implemented based on RAG-Anything's API
            # For now, return basic stats
            stats = {
                "total_documents": 0,
                "by_type": {},
                "processing_enabled": {
                    "images": self.config.enable_image_processing,
                    "office": self.config.enable_office_processing,
                    "pdf": self.config.enable_pdf_processing
                }
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting multimodal stats: {e}")
            return {}
    
    # Proxy methods to maintain LightRAG API compatibility
    async def ainsert(self, content: str, **kwargs):
        """Insert content into the knowledge base"""
        return await self.lightrag.ainsert(content, **kwargs)
    
    async def aquery(self, query: str, param: Optional[QueryParam] = None, **kwargs):
        """Query the knowledge base"""
        if param and hasattr(param, 'mode'):
            return await self.query_with_multimodal(query, mode=param.mode, **kwargs)
        return await self.lightrag.aquery(query, param=param, **kwargs)
    
    def insert(self, content: str, **kwargs):
        """Synchronous insert"""
        return self.lightrag.insert(content, **kwargs)
    
    def query(self, query: str, param: Optional[QueryParam] = None, **kwargs):
        """Synchronous query"""
        return self.lightrag.query(query, param=param, **kwargs)


async def create_multimodal_lightrag(
    lightrag_instance,
    vision_model_func: Optional[Callable] = None,
    config: Optional[MultimodalConfig] = None,
    **kwargs
) -> LightRAGMultimodal:
    """
    Factory function to create a multimodal-enhanced LightRAG instance.
    
    Args:
        lightrag_instance: Existing LightRAG instance
        vision_model_func: Function for processing visual content
        config: Multimodal configuration
        **kwargs: Additional configuration options
        
    Returns:
        Enhanced LightRAG instance with multimodal capabilities
    """
    if config is None:
        config = MultimodalConfig(vision_model_func=vision_model_func)
    elif vision_model_func is not None:
        config.vision_model_func = vision_model_func
    
    multimodal_rag = LightRAGMultimodal(
        lightrag_instance=lightrag_instance,
        multimodal_config=config,
        **kwargs
    )
    
    await multimodal_rag.initialize()
    return multimodal_rag


# Convenience functions for common use cases
def create_openai_vision_func(api_key: str, model: str = "gpt-4o", base_url: Optional[str] = None):
    """
    Create a vision model function using OpenAI's API.
    
    Args:
        api_key: OpenAI API key
        model: Model name (default: gpt-4o)
        base_url: Optional base URL for API
        
    Returns:
        Vision model function compatible with RAG-Anything
    """
    try:
        from lightrag.llm.openai import openai_complete_if_cache
    except ImportError:
        raise ImportError("OpenAI integration not available")
    
    def vision_model_func(prompt, system_prompt=None, history_messages=[], image_data=None, **kwargs):
        if image_data:
            return openai_complete_if_cache(
                model,
                "",
                system_prompt=None,
                history_messages=[],
                messages=[
                    {"role": "system", "content": system_prompt} if system_prompt else None,
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                    ]}
                ],
                api_key=api_key,
                base_url=base_url,
                **kwargs
            )
        else:
            return openai_complete_if_cache(
                "gpt-4o-mini",
                prompt,
                system_prompt=system_prompt,
                history_messages=history_messages,
                api_key=api_key,
                base_url=base_url,
                **kwargs
            )
    
    return vision_model_func
