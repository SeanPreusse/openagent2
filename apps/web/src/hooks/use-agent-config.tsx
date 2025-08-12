import {
  ConfigurableFieldAgentsMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldUIMetadata,
} from "@/types/configurable";
import { useCallback, useState } from "react";
import { useAgents } from "./use-agents";
import {
  extractConfigurationsFromAgent,
  getConfigurableDefaults,
} from "@/lib/ui-config";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { Agent } from "@/types/agent";

/**
 * A custom hook for managing and accessing the configurable
 * fields on an agent.
 */
export function useAgentConfig() {
  const { getAgentConfigSchema } = useAgents();

  const [configurations, setConfigurations] = useState<
    ConfigurableFieldUIMetadata[]
  >([]);
  const [toolConfigurations, setToolConfigurations] = useState<
    ConfigurableFieldMCPMetadata[]
  >([]);
  const [ragConfigurations, setRagConfigurations] = useState<
    ConfigurableFieldRAGMetadata[]
  >([]);
  const [agentsConfigurations, setAgentsConfigurations] = useState<
    ConfigurableFieldAgentsMetadata[]
  >([]);

  const [supportedConfigs, setSupportedConfigs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const clearState = useCallback(() => {
    setConfigurations([]);
    setToolConfigurations([]);
    setRagConfigurations([]);
    setAgentsConfigurations([]);
    setLoading(false);
  }, []);

  const getSchemaAndUpdateConfig = useCallback(
    async (
      agent: Agent,
    ): Promise<{
      name: string;
      description: string;
      config: Record<string, any>;
    }> => {
      clearState();

      setLoading(true);
      try {
        const schema = await getAgentConfigSchema(
          agent.assistant_id,
          agent.deploymentId,
        );
        if (!schema) {
          console.warn(`No config schema found for agent ${agent.assistant_id}`);
          return {
            name: agent.name,
            description:
              (agent.metadata?.description as string | undefined) ?? "",
            config: {},
          };
        }
        const { configFields, toolConfig, ragConfig, agentsConfig } =
          extractConfigurationsFromAgent({
            agent,
            schema,
          });

        const agentId = agent.assistant_id;

        setConfigurations(configFields);
        setToolConfigurations(toolConfig);

        // Load saved config from backend into local store
        // The extractConfigurationsFromAgent already includes saved values as defaults
        const { setDefaultConfig, updateConfig } = useConfigStore.getState();
        
        // Force update store with backend configuration (this will overwrite localStorage)
        console.log("=== LOADING BACKEND CONFIG INTO STORE ===");
        console.log("Agent ID:", agentId);
        console.log("Config fields from backend:", configFields.map(f => ({ label: f.label, default: f.default })));
        console.log("Tool config from backend:", toolConfig.map(f => ({ label: f.label, default: f.default })));
        console.log("RAG config from backend:", ragConfig.map(f => ({ label: f.label, default: f.default })));
        
        // Set the main config fields from backend
        configFields.forEach(field => {
          if (field.default !== undefined) {
            updateConfig(agentId, field.label, field.default);
          }
        });

        const supportedConfigs: string[] = [];

        if (toolConfig.length) {
          // Set tools config from backend
          toolConfig.forEach(field => {
            if (field.default !== undefined) {
              updateConfig(`${agentId}:selected-tools`, field.label, field.default);
            }
          });
          setToolConfigurations(toolConfig);
          supportedConfigs.push("tools");
        }
        if (ragConfig.length) {
          // Set RAG config from backend
          ragConfig.forEach(field => {
            if (field.default !== undefined) {
              updateConfig(`${agentId}:rag`, field.label, field.default);
            }
          });
          setRagConfigurations(ragConfig);
          supportedConfigs.push("rag");
        }
        if (agentsConfig.length) {
          // Set agents config from backend
          agentsConfig.forEach(field => {
            if (field.default !== undefined) {
              updateConfig(`${agentId}:agents`, field.label, field.default);
            }
          });
          setAgentsConfigurations(agentsConfig);
          supportedConfigs.push("supervisor");
        }
        setSupportedConfigs(supportedConfigs);

        const configurableDefaults = getConfigurableDefaults(
          configFields,
          toolConfig,
          ragConfig,
          agentsConfig,
        );

        return {
          name: agent.name,
          description:
            (agent.metadata?.description as string | undefined) ?? "",
          config: configurableDefaults,
        };
      } catch (error) {
        console.error("Error in getSchemaAndUpdateConfig:", error);
        // Return basic structure even if there's an error
        return {
          name: agent.name,
          description:
            (agent.metadata?.description as string | undefined) ?? "",
          config: {},
        };
      } finally {
        setLoading(false);
      }
    },
    [clearState, getAgentConfigSchema],
  );

  return {
    clearState,
    getSchemaAndUpdateConfig,

    configurations,
    toolConfigurations,
    ragConfigurations,
    agentsConfigurations,
    supportedConfigs,

    loading,
  };
}
