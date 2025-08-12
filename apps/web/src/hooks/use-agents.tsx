import { createClient } from "@/lib/client";
import { Agent } from "@/types/agent";
import { Assistant } from "@langchain/langgraph-sdk";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";
import { useCallback } from "react";
import { isSystemCreatedDefaultAssistant } from "@/lib/agent-utils";

export function useAgents() {
  const { session } = useAuthContext();

  const getAgent = useCallback(
    async (
      agentId: string,
      deploymentId: string,
    ): Promise<Agent | undefined> => {
      if (!session?.accessToken) {
        toast.error("No access token found", {
          richColors: true,
        });
        return;
      }
      try {
        const client = createClient(deploymentId, session.accessToken);
        const agent = await client.assistants.get(agentId);
        // Never expose the system created default assistants to the user
        if (isSystemCreatedDefaultAssistant(agent)) {
          return undefined;
        }
        return { ...agent, deploymentId };
      } catch (e) {
        console.error("Failed to get agent", e);
        toast.error("Failed to get agent");
        return undefined;
      }
    },
    [session?.accessToken],
  );

  const getAgentConfigSchema = useCallback(
    async (agentId: string, deploymentId: string) => {
      if (!session?.accessToken) {
        toast.error("No access token found", {
          richColors: true,
        });
        return;
      }
      try {
        console.log(`Fetching config schema for agent ${agentId} in deployment ${deploymentId}`);
        const client = createClient(deploymentId, session.accessToken);
        const schemas = await client.assistants.getSchemas(agentId);

        if (!schemas.config_schema) {
          console.warn(`No config schema returned for agent ${agentId}`);
        }
        return schemas.config_schema ?? undefined;
      } catch (e) {
        console.error("Failed to get agent config schema", e);
        
        // Check if it's a 404 error (agent not found)
        if (e && typeof e === 'object' && 'status' in e && e.status === 404) {
          console.warn(`Agent ${agentId} not found (404) - it may still be initializing`);
          return undefined; // Don't show error for 404s, agent might still be creating
        }
        
        toast.error("Failed to get agent config", {
          description: (
            <div className="flex flex-col items-start gap-2">
              <p>Error fetching configuration schema</p>
              <p className="text-sm text-muted-foreground">
                {e && typeof e === 'object' && 'message' in e 
                  ? (e as Error).message 
                  : 'Unknown error'}
              </p>
              <p>
                Agent ID:{" "}
                <span className="font-mono font-semibold">{agentId}</span>
              </p>
              <p>
                Deployment ID:{" "}
                <span className="font-mono font-semibold">{deploymentId}</span>
              </p>
            </div>
          ),
          richColors: true,
        });
        return undefined;
      }
    },
    [session?.accessToken],
  );

  const createAgent = useCallback(
    async (
      deploymentId: string,
      graphId: string,
      args: {
        name: string;
        description: string;
        config: Record<string, any>;
      },
    ): Promise<Assistant | undefined> => {
      if (!session?.accessToken) {
        toast.error("No access token found", {
          richColors: true,
        });
        return;
      }
      try {
        const client = createClient(deploymentId, session.accessToken);
        const agent = await client.assistants.create({
          graphId,
          metadata: {
            description: args.description,
          },
          name: args.name,
          config: {
            configurable: {
              ...args.config,
            },
          },
        });
        return agent;
      } catch (e) {
        console.error("Failed to create agent", e);
        toast.error("Failed to create agent");
        return undefined;
      }
    },
    [session?.accessToken],
  );

  const updateAgent = useCallback(
    async (
      agentId: string,
      deploymentId: string,
      args: {
        name?: string;
        description?: string;
        config?: Record<string, any>;
      },
    ): Promise<Assistant | undefined> => {
      if (!session?.accessToken) {
        toast.error("No access token found", {
          richColors: true,
        });
        return;
      }
      try {
        const client = createClient(deploymentId, session.accessToken);
        
        // First get the current agent to preserve its existing metadata
        const currentAgent = await client.assistants.get(agentId);
        
        const updatePayload = {
          metadata: {
            ...currentAgent.metadata, // Preserve all existing metadata
            ...(args.description && { description: args.description }),
          },
          ...(args.name && { name: args.name }),
          ...(args.config && { config: { configurable: args.config } }),
        };
        
        console.log("Update payload metadata:", {
          currentAgentMetadata: currentAgent.metadata,
          finalMetadata: updatePayload.metadata,
          preservedCreatedBy: updatePayload.metadata?.created_by,
          hasDescription: !!args.description,
          hasName: !!args.name,
          hasConfig: !!args.config,
          payloadKeys: Object.keys(updatePayload)
        });
        
        console.log("Sending agent update to backend:", {
          agentId,
          deploymentId,
          payload: updatePayload,
          configKeys: args.config ? Object.keys(args.config) : []
        });
        
        const agent = await client.assistants.update(agentId, updatePayload);
        
        console.log("Backend response agent config:", {
          agentId: agent.assistant_id,
          config: agent.config,
          configurable: agent.config?.configurable,
          configurableKeys: agent.config?.configurable ? Object.keys(agent.config.configurable) : [],
          metadata: agent.metadata,
          created_by: agent.metadata?.created_by,
          isSystemCreated: agent.metadata?.created_by === "system"
        });
        
        return agent;
      } catch (e) {
        console.error("Failed to update agent", e);
        toast.error("Failed to update agent");
        return undefined;
      }
    },
    [session?.accessToken],
  );

  const deleteAgent = useCallback(
    async (deploymentId: string, agentId: string): Promise<boolean> => {
      if (!session?.accessToken) {
        toast.error("No access token found", {
          richColors: true,
        });
        return false;
      }
      try {
        const client = createClient(deploymentId, session.accessToken);
        await client.assistants.delete(agentId);
        return true;
      } catch (e) {
        console.error("Failed to delete agent", e);
        toast.error("Failed to delete agent");
        return false;
      }
    },
    [session?.accessToken],
  );

  return {
    getAgent,
    getAgentConfigSchema,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}
