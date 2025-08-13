from .lightrag import LightRAG as LightRAG, QueryParam as QueryParam
from .multimodal import (
    LightRAGMultimodal,
    MultimodalConfig,
    create_multimodal_lightrag,
    create_openai_vision_func,
    RAGANYTHING_AVAILABLE,
)

__version__ = "1.4.7"
__author__ = "Zirui Guo"
__url__ = "https://github.com/HKUDS/LightRAG"

# Export multimodal components
__all__ = [
    "LightRAG",
    "QueryParam",
    "LightRAGMultimodal",
    "MultimodalConfig", 
    "create_multimodal_lightrag",
    "create_openai_vision_func",
    "RAGANYTHING_AVAILABLE",
]
