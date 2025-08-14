"""
Example: LightRAG with RAG-Anything Multimodal Integration

This example demonstrates how to use LightRAG with RAG-Anything for processing
multimodal documents including Excel files, PowerPoint presentations, and images.
"""

import asyncio
import os
from lightrag import LightRAG, create_multimodal_lightrag, create_openai_vision_func, MultimodalConfig
from lightrag.llm.openai import openai_complete_if_cache, openai_embed
from lightrag.utils import EmbeddingFunc


async def basic_multimodal_example():
    """Basic example of multimodal document processing"""
    
    # Configuration
    working_dir = "./lightrag_multimodal_storage"
    api_key = "your-openai-api-key"  # Replace with your actual API key
    base_url = None  # Set if using a different OpenAI-compatible endpoint
    
    # Create LightRAG instance
    lightrag_instance = LightRAG(
        working_dir=working_dir,
        llm_model_func=lambda prompt, system_prompt=None, history_messages=[], **kwargs: openai_complete_if_cache(
            "gpt-4o-mini",
            prompt,
            system_prompt=system_prompt,
            history_messages=history_messages,
            api_key=api_key,
            base_url=base_url,
            **kwargs,
        ),
        embedding_func=EmbeddingFunc(
            embedding_dim=3072,
            func=lambda texts: openai_embed(
                texts,
                model="text-embedding-3-large",
                api_key=api_key,
                base_url=base_url,
            ),
        )
    )
    
    # Initialize storage
    await lightrag_instance.initialize_storages()
    
    # Create vision model function for multimodal processing
    vision_model_func = create_openai_vision_func(
        api_key=api_key,
        model="gpt-4o",
        base_url=base_url
    )
    
    # Create multimodal configuration
    multimodal_config = MultimodalConfig(
        vision_model_func=vision_model_func,
        enable_image_processing=True,
        enable_office_processing=True,
        enable_pdf_processing=True,
        output_dir="./multimodal_output"
    )
    
    # Create enhanced LightRAG with multimodal capabilities
    multimodal_rag = await create_multimodal_lightrag(
        lightrag_instance=lightrag_instance,
        config=multimodal_config
    )
    
    print("✅ LightRAG with multimodal capabilities initialized successfully!")
    
    # Example 1: Process an Excel file
    print("\n📊 Processing Excel file...")
    try:
        excel_result = await multimodal_rag.process_office_document(
            file_path="path/to/your/spreadsheet.xlsx",
            extract_tables=True,
            extract_images=True
        )
        print(f"Excel processing result: {excel_result.get('document_type', 'Unknown')}")
    except FileNotFoundError:
        print("Excel file not found - skipping Excel processing example")
    except Exception as e:
        print(f"Excel processing error: {e}")
    
    # Example 2: Process a PowerPoint presentation
    print("\n📈 Processing PowerPoint presentation...")
    try:
        ppt_result = await multimodal_rag.process_office_document(
            file_path="path/to/your/presentation.pptx",
            extract_tables=True,
            extract_images=True
        )
        print(f"PowerPoint processing result: {ppt_result.get('document_type', 'Unknown')}")
    except FileNotFoundError:
        print("PowerPoint file not found - skipping PowerPoint processing example")
    except Exception as e:
        print(f"PowerPoint processing error: {e}")
    
    # Example 3: Process an image
    print("\n🖼️ Processing image...")
    try:
        image_result = await multimodal_rag.process_image(
            image_path="path/to/your/image.png",
            description_prompt="Describe this image and extract any text or data visible in it."
        )
        print(f"Image processing result: {image_result.get('description', 'No description')[:100]}...")
    except FileNotFoundError:
        print("Image file not found - skipping image processing example")
    except Exception as e:
        print(f"Image processing error: {e}")
    
    # Example 4: Process any multimodal document
    print("\n📄 Processing multimodal document...")
    try:
        doc_result = await multimodal_rag.process_document_complete(
            file_path="path/to/your/document.pdf"
        )
        print(f"Document processing result: {doc_result.get('status', 'Unknown')}")
    except FileNotFoundError:
        print("Document file not found - skipping document processing example")
    except Exception as e:
        print(f"Document processing error: {e}")
    
    # Example 5: Query with multimodal support
    print("\n🔍 Querying with multimodal support...")
    try:
        query_result = await multimodal_rag.query_with_multimodal(
            "What information is available in the processed documents about financial data?",
            mode="hybrid"
        )
        print(f"Query result: {query_result[:200]}...")
    except Exception as e:
        print(f"Query error: {e}")
    
    # Example 6: Get multimodal statistics
    print("\n📊 Getting multimodal statistics...")
    try:
        stats = await multimodal_rag.get_multimodal_stats()
        print(f"Multimodal stats: {stats}")
    except Exception as e:
        print(f"Stats error: {e}")


async def existing_lightrag_integration_example():
    """Example of integrating RAG-Anything with an existing LightRAG instance"""
    
    working_dir = "./existing_lightrag_storage"
    api_key = "your-openai-api-key"  # Replace with your actual API key
    
    # Check if existing LightRAG instance exists
    if os.path.exists(working_dir) and os.listdir(working_dir):
        print("✅ Found existing LightRAG instance, loading...")
    else:
        print("❌ No existing LightRAG instance found, will create new one")
    
    # Create/Load existing LightRAG instance
    lightrag_instance = LightRAG(
        working_dir=working_dir,
        llm_model_func=lambda prompt, system_prompt=None, history_messages=[], **kwargs: openai_complete_if_cache(
            "gpt-4o-mini",
            prompt,
            system_prompt=system_prompt,
            history_messages=history_messages,
            api_key=api_key,
            **kwargs,
        ),
        embedding_func=EmbeddingFunc(
            embedding_dim=3072,
            func=lambda texts: openai_embed(
                texts,
                model="text-embedding-3-large",
                api_key=api_key,
            ),
        )
    )
    
    # Initialize storage (this will load existing data if available)
    await lightrag_instance.initialize_storages()
    
    # Create vision model function
    vision_model_func = create_openai_vision_func(api_key=api_key)
    
    # Enhance with multimodal capabilities
    multimodal_rag = await create_multimodal_lightrag(
        lightrag_instance=lightrag_instance,
        vision_model_func=vision_model_func
    )
    
    # Query existing knowledge base
    result = await multimodal_rag.query_with_multimodal(
        "What data has been processed in this LightRAG instance?",
        mode="hybrid"
    )
    print("Query result:", result[:200] + "..." if len(result) > 200 else result)
    
    # Add new multimodal documents to existing instance
    print("\n📄 Adding new multimodal document...")
    try:
        await multimodal_rag.process_document_complete(
            file_path="path/to/new/multimodal_document.pdf"
        )
        print("✅ Document added successfully!")
    except FileNotFoundError:
        print("Document file not found - skipping document addition")
    except Exception as e:
        print(f"Error adding document: {e}")


async def custom_vision_model_example():
    """Example using a custom vision model function"""
    
    def custom_vision_model_func(prompt, system_prompt=None, history_messages=[], image_data=None, **kwargs):
        """
        Custom vision model function - replace with your preferred vision model
        This example shows the interface that needs to be implemented
        """
        if image_data:
            # Process image with your vision model
            # This is a placeholder - implement with your actual vision model
            return f"Custom vision model processed image with prompt: {prompt}"
        else:
            # Process text-only queries
            return f"Custom model processed text: {prompt}"
    
    working_dir = "./custom_vision_storage"
    
    # Create LightRAG instance (simplified for example)
    lightrag_instance = LightRAG(
        working_dir=working_dir,
        # Add your LLM and embedding functions here
    )
    
    await lightrag_instance.initialize_storages()
    
    # Create multimodal configuration with custom vision function
    config = MultimodalConfig(
        vision_model_func=custom_vision_model_func,
        image_description_prompt="Please analyze this image and extract all relevant information.",
        output_dir="./custom_output"
    )
    
    # Create enhanced instance
    multimodal_rag = await create_multimodal_lightrag(
        lightrag_instance=lightrag_instance,
        config=config
    )
    
    print("✅ Custom vision model integration complete!")


def main():
    """Main function to run examples"""
    print("🚀 LightRAG Multimodal Integration Examples")
    print("=" * 50)
    
    # Check if RAG-Anything is available
    from lightrag import RAGANYTHING_AVAILABLE
    
    if not RAGANYTHING_AVAILABLE:
        print("❌ RAG-Anything is not installed.")
        print("Please install it with: pip install raganything")
        return
    
    print("✅ RAG-Anything is available!")
    print("\nRunning examples...")
    
    # Run examples
    print("\n1. Basic Multimodal Example")
    print("-" * 30)
    asyncio.run(basic_multimodal_example())
    
    print("\n2. Existing LightRAG Integration Example")
    print("-" * 30)
    asyncio.run(existing_lightrag_integration_example())
    
    print("\n3. Custom Vision Model Example")
    print("-" * 30)
    asyncio.run(custom_vision_model_example())
    
    print("\n✅ All examples completed!")


if __name__ == "__main__":
    main()

