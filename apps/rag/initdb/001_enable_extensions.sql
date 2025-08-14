-- Enable required extensions for LightRAG with Postgres graph/vector storages
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS age;
LOAD 'age';
SELECT * FROM ag_catalog.create_graph('lightrag_graph');



