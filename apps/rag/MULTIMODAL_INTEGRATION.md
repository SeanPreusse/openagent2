# LightRAG Multimodal Integration with RAG-Anything

LightRAG now supports comprehensive multimodal document processing through seamless integration with RAG-Anything. This integration enables you to process Excel spreadsheets, PowerPoint presentations, images, and other multimodal documents while leveraging LightRAG's powerful knowledge graph capabilities.

## 🚀 Quick Start

### Installation

First, ensure you have RAG-Anything installed:

```bash
pip install raganything
```

This dependency is automatically included when you install the enhanced LightRAG.

### Basic Usage

```python
import asyncio
from lightrag import LightRAG, create_multimodal_lightrag, create_openai_vision_func
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc

async def main():
    # Create standard LightRAG instance
    lightrag_instance = LightRAG(
        working_dir="./multimodal_storage",
        llm_model_func=lambda prompt, **kwargs: openai_complete_if_cache(
            "gpt-4o-mini", prompt, api_key="your-api-key", **kwargs
        ),
        embedding_func=EmbeddingFunc(
            embedding_dim=3072,
            func=lambda texts: openai_embed(
                texts, model="text-embedding-3-large", api_key="your-api-key"
            ),
        )
    )
    
    await lightrag_instance.initialize_storages()
    
    # Create vision model function for multimodal processing
    vision_func = create_openai_vision_func(api_key="your-api-key")
    
    # Enhance with multimodal capabilities
    multimodal_rag = await create_multimodal_lightrag(
        lightrag_instance=lightrag_instance,
        vision_model_func=vision_func
    )
    
    # Process multimodal documents
    await multimodal_rag.process_document_complete("document.xlsx")
    await multimodal_rag.process_document_complete("presentation.pptx") 
    await multimodal_rag.process_document_complete("chart.png")
    
    # Query with multimodal support
    result = await multimodal_rag.query_with_multimodal(
        "What financial data is shown in the processed documents?",
        mode="hybrid"
    )
    print(result)

asyncio.run(main())
```

## 📋 Supported Document Types

| Document Type | Extensions | Features |
|---------------|------------|----------|
| **Excel Spreadsheets** | `.xlsx`, `.xls` | Table extraction, formula processing, chart analysis |
| **PowerPoint Presentations** | `.pptx`, `.ppt` | Slide content, embedded images, charts, speaker notes |
| **Word Documents** | `.docx`, `.doc` | Text content, embedded images, tables |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`, `.svg` | OCR, chart analysis, diagram understanding |
| **PDFs** | `.pdf` | Enhanced extraction with image and table processing |

## 🔧 Configuration

### MultimodalConfig

Configure multimodal processing behavior:

```python
from lightrag import MultimodalConfig

config = MultimodalConfig(
    vision_model_func=vision_func,
    enable_image_processing=True,
    enable_office_processing=True,
    enable_pdf_processing=True,
    output_dir="./multimodal_output",
    chunk_size=1000,
    chunk_overlap=200,
    image_description_prompt="Describe this image in detail, focusing on any text, data, charts, or important visual elements.",
    table_extraction_prompt="Extract and describe the structure and content of any tables in this document."
)

multimodal_rag = await create_multimodal_lightrag(
    lightrag_instance=lightrag_instance,
    config=config
)
```

### Vision Model Functions

#### OpenAI GPT-4V

```python
from lightrag import create_openai_vision_func

vision_func = create_openai_vision_func(
    api_key="your-openai-api-key",
    model="gpt-4o",  # or "gpt-4-vision-preview"
    base_url=None  # Optional: for OpenAI-compatible endpoints
)
```

#### Custom Vision Model

```python
def custom_vision_func(prompt, system_prompt=None, history_messages=[], image_data=None, **kwargs):
    if image_data:
        # Process image with your vision model
        # image_data is base64 encoded
        return your_vision_model.process(prompt, image_data)
    else:
        # Process text-only queries
        return your_text_model.process(prompt)
```

## 📄 Processing Documents

### Excel Spreadsheets

```python
# Process Excel file with table and image extraction
result = await multimodal_rag.process_office_document(
    file_path="financial_report.xlsx",
    extract_tables=True,
    extract_images=True
)

print(f"Document type: {result['document_type']}")
print(f"Extracted tables: {len(result['tables'])}")
print(f"Extracted images: {len(result['images'])}")
```

### PowerPoint Presentations

```python
# Process PowerPoint presentation
result = await multimodal_rag.process_office_document(
    file_path="company_presentation.pptx",
    extract_tables=True,
    extract_images=True
)

# Access slide content, speaker notes, and embedded media
```

### Images

```python
# Process individual images
result = await multimodal_rag.process_image(
    image_path="chart.png",
    description_prompt="Analyze this chart and extract all numerical data and trends."
)

print(f"Image description: {result['description']}")
```

### Any Multimodal Document

```python
# Process any supported document type
result = await multimodal_rag.process_document_complete(
    file_path="document.pdf",  # Automatically detects type
    track_id="optional-tracking-id"
)
```

## 🔍 Querying Multimodal Content

### Hybrid Queries

```python
# Query across text and multimodal content
result = await multimodal_rag.query_with_multimodal(
    "What are the key financial metrics shown in the Q3 report?",
    mode="hybrid"  # Combines knowledge graph and vector search
)
```

### Mode Options

- `"hybrid"`: Combines local and global knowledge with multimodal content
- `"local"`: Focuses on context-dependent multimodal information
- `"global"`: Uses global knowledge graph including multimodal entities
- `"naive"`: Basic search across all content types

### Advanced Query Parameters

```python
from lightrag import QueryParam

param = QueryParam(
    mode="hybrid",
    top_k=10,
    response_type="Multiple Paragraphs",
    enable_rerank=True
)

result = await multimodal_rag.aquery(
    "Analyze the trends in the sales data from the Excel files",
    param=param
)
```

## 🔄 Integration with Existing LightRAG

### Enhancing Existing Instance

```python
# Load existing LightRAG instance
existing_lightrag = LightRAG(working_dir="./existing_storage")
await existing_lightrag.initialize_storages()

# Enhance with multimodal capabilities
multimodal_rag = await create_multimodal_lightrag(
    lightrag_instance=existing_lightrag,
    vision_model_func=vision_func
)

# Continue using existing knowledge base with new multimodal features
result = await multimodal_rag.query_with_multimodal(
    "What new insights can be found in the uploaded images?",
    mode="hybrid"
)
```

### Backward Compatibility

The multimodal integration maintains full backward compatibility:

```python
# These methods work exactly as before
await multimodal_rag.ainsert("Regular text content")
result = await multimodal_rag.aquery("Regular text query")

# Plus new multimodal capabilities
await multimodal_rag.process_document_complete("image.png")
```

## 📊 Monitoring and Statistics

### Processing Statistics

```python
stats = await multimodal_rag.get_multimodal_stats()
print(f"Total documents processed: {stats['total_documents']}")
print(f"By type: {stats['by_type']}")
print(f"Processing capabilities: {stats['processing_enabled']}")
```

### Document Status Tracking

```python
# Process with tracking ID
result = await multimodal_rag.process_document_complete(
    file_path="large_presentation.pptx",
    track_id="presentation-2024-q3"
)

# Track processing status (if using document status storage)
# This integrates with LightRAG's existing document tracking
```

## 🛠️ Advanced Features

### Batch Processing

```python
documents = [
    "report1.xlsx",
    "presentation.pptx", 
    "chart1.png",
    "chart2.png"
]

for doc in documents:
    try:
        result = await multimodal_rag.process_document_complete(doc)
        print(f"✅ Processed: {doc}")
    except Exception as e:
        print(f"❌ Failed: {doc} - {e}")
```

### Custom Processing Pipelines

```python
from lightrag import MultimodalConfig

# Configure for specific use case
financial_config = MultimodalConfig(
    vision_model_func=vision_func,
    image_description_prompt="""
    Analyze this financial chart or document:
    1. Extract all numerical data and percentages
    2. Identify trends and patterns
    3. Note any anomalies or significant changes
    4. Describe the chart type and visualization method
    """,
    table_extraction_prompt="""
    Extract financial table data:
    1. Preserve exact numerical values
    2. Identify column headers and row labels
    3. Note any calculated fields or totals
    4. Describe the table structure and purpose
    """
)

financial_rag = await create_multimodal_lightrag(
    lightrag_instance=lightrag_instance,
    config=financial_config
)
```

## 🔧 Troubleshooting

### Common Issues

1. **RAG-Anything Not Found**
   ```bash
   pip install raganything
   ```

2. **Vision Model Errors**
   - Ensure your API key is valid
   - Check model availability (e.g., GPT-4V access)
   - Verify image format compatibility

3. **File Processing Errors**
   - Check file permissions
   - Ensure file format is supported
   - Verify file is not corrupted

### Logging

```python
import logging
from lightrag.utils import logger

# Enable debug logging
logger.setLevel(logging.DEBUG)
```

### Error Handling

```python
try:
    result = await multimodal_rag.process_document_complete("document.xlsx")
except FileNotFoundError:
    print("Document not found")
except ImportError:
    print("RAG-Anything not installed")
except Exception as e:
    print(f"Processing error: {e}")
    # Falls back to regular LightRAG functionality
```

## 🎯 Best Practices

### 1. Document Organization

```python
# Organize by document type for better tracking
await multimodal_rag.process_document_complete("./excel/Q3_report.xlsx")
await multimodal_rag.process_document_complete("./presentations/board_meeting.pptx")
await multimodal_rag.process_document_complete("./images/sales_chart.png")
```

### 2. Prompt Engineering

```python
# Use specific prompts for different content types
chart_prompt = "Analyze this chart and extract key metrics, trends, and insights."
table_prompt = "Extract table data preserving structure and relationships."
image_prompt = "Describe visual elements and extract any visible text or data."
```

### 3. Query Strategies

```python
# Combine multimodal and text queries for comprehensive results
result1 = await multimodal_rag.query_with_multimodal(
    "What do the charts show about Q3 performance?", 
    mode="hybrid"
)

result2 = await multimodal_rag.query_with_multimodal(
    "Summarize the key points from all PowerPoint presentations",
    mode="global"
)
```

### 4. Performance Optimization

```python
# Process large documents with tracking
await multimodal_rag.process_document_complete(
    "large_document.pdf",
    track_id=f"batch-{datetime.now().isoformat()}"
)

# Use appropriate chunk sizes for your content
config = MultimodalConfig(
    chunk_size=1500,  # Larger for detailed documents
    chunk_overlap=300  # More overlap for better context
)
```

## 🚀 Examples

See `examples/multimodal_example.py` for complete working examples including:

- Basic multimodal document processing
- Integration with existing LightRAG instances
- Custom vision model implementation
- Batch processing workflows
- Error handling and fallback strategies

## 📚 API Reference

### Core Classes

- `LightRAGMultimodal`: Enhanced LightRAG with multimodal capabilities
- `MultimodalConfig`: Configuration for multimodal processing
- `create_multimodal_lightrag()`: Factory function for creating enhanced instances
- `create_openai_vision_func()`: Helper for OpenAI vision model integration

### Key Methods

- `process_document_complete()`: Process any multimodal document
- `process_image()`: Process individual images
- `process_office_document()`: Process Office documents (Excel, PowerPoint, Word)
- `query_with_multimodal()`: Query with multimodal content support
- `get_multimodal_stats()`: Get processing statistics

For detailed API documentation, see the docstrings in `lightrag/multimodal.py`.
