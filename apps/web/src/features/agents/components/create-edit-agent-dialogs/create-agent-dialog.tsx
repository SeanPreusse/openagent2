import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAgents } from "@/hooks/use-agents";
import { Bot, LoaderCircle, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm, AgentFieldsFormLoading } from "./agent-form";
import { Deployment } from "@/types/deployment";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { Agent } from "@/types/agent";
import { getDeployments } from "@/lib/environment/deployments";
import { GraphSelect } from "./graph-select";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { FormProvider, useForm } from "react-hook-form";

interface CreateAgentDialogProps {
  agentId?: string;
  deploymentId?: string;
  graphId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateAgentFormContent(props: {
  selectedGraph: Agent;
  selectedDeployment: Deployment;
  onClose: () => void;
}) {
  const form = useForm<{
    name: string;
    description: string;
    config: Record<string, any>;
  }>({
    defaultValues: async () => {
      const values = await getSchemaAndUpdateConfig(props.selectedGraph);
      return { name: "", description: "", config: values.config };
    },
  });

  const { createAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const {
    getSchemaAndUpdateConfig,
    loading,
    configurations,
    toolConfigurations,
    ragConfigurations,
    agentsConfigurations,
  } = useAgentConfig();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    config: Record<string, any>;
  }) => {
    const { name, description } = data;
    if (!name || !description) {
      toast.warning("Name and description are required", {
        richColors: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get the current config from the config store for this agent
      const { getAgentConfig } = useConfigStore.getState();
      const agentId = props.selectedGraph.assistant_id;
      const storeConfig = getAgentConfig(agentId);
      
      // Merge form config with store config, prioritizing form config for externally managed fields
      // and store config for store-managed fields
      const cleanStoreConfig = Object.fromEntries(
        Object.entries(storeConfig).filter(([_, value]) => value !== undefined)
      );
      
      // Form data takes priority as it contains the latest user input
      const finalConfig = {
        ...cleanStoreConfig,
        ...data.config,
      };

      console.log("Form config:", data.config);
      console.log("Store config:", cleanStoreConfig);
      console.log("Final merged config:", finalConfig);
      
      // Debug RAG specifically
      if (ragConfigurations.length > 0) {
        const ragLabel = ragConfigurations[0].label;
        console.log(`RAG field (${ragLabel}) in form:`, data.config[ragLabel]);
        console.log(`RAG field (${ragLabel}) in store:`, cleanStoreConfig[ragLabel]);
        console.log(`RAG field (${ragLabel}) final:`, finalConfig[ragLabel]);
      }

      const newAgent = await createAgent(
        props.selectedDeployment.id,
        props.selectedGraph.graph_id,
        {
          name,
          description,
          config: finalConfig,
        },
      );

      if (!newAgent) {
        toast.error("Failed to create agent", {
          description: "Please try again",
          richColors: true,
        });
        return;
      }

      toast.success("Agent created successfully!", {
        richColors: true,
      });

      props.onClose();
      
      // Wait a moment before refreshing to allow the agent to be fully initialized
      setTimeout(() => {
        refreshAgents();
      }, 1000);
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent", {
        description: "An unexpected error occurred",
        richColors: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {loading ? (
        <AgentFieldsFormLoading />
      ) : (
        <FormProvider {...form}>
          <AgentFieldsForm
            agentId={props.selectedGraph.assistant_id}
            configurations={configurations}
            toolConfigurations={toolConfigurations}
            ragConfigurations={ragConfigurations}
            agentsConfigurations={agentsConfigurations}
          />
        </FormProvider>
      )}
      <AlertDialogFooter>
        <Button
          onClick={(e) => {
            e.preventDefault();
            props.onClose();
          }}
          variant="outline"
          disabled={loading || submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex w-full items-center justify-center gap-1"
          disabled={loading || submitting}
        >
          {submitting ? <LoaderCircle className="animate-spin" /> : <Bot />}
          <span>{submitting ? "Creating..." : "Create Agent"}</span>
        </Button>
      </AlertDialogFooter>
    </form>
  );
}

export function CreateAgentDialog({
  agentId,
  deploymentId,
  graphId,
  open,
  onOpenChange,
}: CreateAgentDialogProps) {
  const deployments = getDeployments();
  const { agents } = useAgentsContext();

  const [selectedDeployment, setSelectedDeployment] = useState<
    Deployment | undefined
  >();
  const [selectedGraph, setSelectedGraph] = useState<Agent | undefined>();

  useEffect(() => {
    if (selectedDeployment || selectedGraph) return;
    if (agentId && deploymentId && graphId) {
      // Find the deployment & default agent, then set them
      const deployment = deployments.find((d) => d.id === deploymentId);
      const defaultAgent = agents.find(
        (a) => a.assistant_id === agentId && a.deploymentId === deploymentId,
      );
      if (!deployment || !defaultAgent) {
        toast.error("Something went wrong. Please try again.", {
          richColors: true,
        });
        return;
      }

      setSelectedDeployment(deployment);
      setSelectedGraph(defaultAgent);
    }
  }, [
    agentId,
    deploymentId,
    graphId,
    agents,
    deployments,
    selectedDeployment,
    selectedGraph,
  ]);

  const [openCounter, setOpenCounter] = useState(0);

  const lastOpen = useRef(open);
  useLayoutEffect(() => {
    if (lastOpen.current !== open && open) {
      setOpenCounter((c) => c + 1);
    }
    lastOpen.current = open;
  }, [open, setOpenCounter]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="h-auto max-h-[90vh] overflow-auto sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
        <AlertDialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <AlertDialogTitle>Create Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new agent for &apos;
                <span className="font-medium">{selectedGraph?.graph_id}</span>
                &apos; graph.
              </AlertDialogDescription>
            </div>
            <AlertDialogCancel size="icon">
              <X className="size-4" />
            </AlertDialogCancel>
          </div>
        </AlertDialogHeader>

        {!agentId && !graphId && !deploymentId && (
          <div className="flex flex-col items-start justify-start gap-2">
            <p>Please select a graph to create an agent for.</p>
            <GraphSelect
              className="w-full"
              agents={agents}
              selectedGraph={selectedGraph}
              setSelectedGraph={setSelectedGraph}
              selectedDeployment={selectedDeployment}
              setSelectedDeployment={setSelectedDeployment}
            />
          </div>
        )}

        {selectedGraph && selectedDeployment ? (
          <CreateAgentFormContent
            key={`${openCounter}-${selectedGraph.assistant_id}`}
            selectedGraph={selectedGraph}
            selectedDeployment={selectedDeployment}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
