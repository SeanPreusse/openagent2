"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ConfigurableFieldUIMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldAgentsMetadata,
} from "@/types/configurable";

interface ConfigState {
  configsByAgentId: Record<string, Record<string, any>>;
  getAgentConfig: (agentId: string) => Record<string, any>;
  updateConfig: (agentId: string, key: string, value: any) => void;
  resetConfig: (agentId: string) => void;
  setDefaultConfig: (
    agentId: string,
    configurations:
      | ConfigurableFieldMCPMetadata[]
      | ConfigurableFieldUIMetadata[]
      | ConfigurableFieldRAGMetadata[]
      | ConfigurableFieldAgentsMetadata[],
  ) => void;
  resetStore: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      configsByAgentId: {},

      getAgentConfig: (agentId: string) => {
        const state = get();
        const baseConfig = state.configsByAgentId[agentId];
        const toolsConfig = state.configsByAgentId[`${agentId}:selected-tools`];
        const ragConfig = state.configsByAgentId[`${agentId}:rag`];
        const agentsConfig = state.configsByAgentId[`${agentId}:agents`];
        
        console.log(`Getting agent config for ${agentId}:`, {
          baseConfig,
          toolsConfig,
          ragConfig,
          agentsConfig,
          allConfigs: Object.keys(state.configsByAgentId)
        });
        
        const configObj = {
          ...baseConfig,
          ...toolsConfig,
          ...ragConfig,
          ...agentsConfig,
        };
        delete configObj.__defaultValues;
        
        // Validation check
        const configKeys = Object.keys(configObj);
        const hasValidConfig = configKeys.length > 0;
        console.log(`Final merged config for ${agentId}:`, {
          config: configObj,
          keyCount: configKeys.length,
          keys: configKeys,
          hasValidConfig,
          isEmpty: !hasValidConfig
        });
        
        if (!hasValidConfig) {
          console.error(`WARNING: getAgentConfig returning empty config for agent ${agentId}!`);
        }
        return configObj;
      },

      updateConfig: (agentId, key, value) => {
        console.log(`Updating config: agentId=${agentId}, key=${key}, value=`, value);
        set((state) => {
          const newState = {
            configsByAgentId: {
              ...state.configsByAgentId,
              [agentId]: {
                ...(state.configsByAgentId[agentId] || {}),
                [key]: value,
              },
            },
          };
          console.log(`Updated config store:`, newState.configsByAgentId[agentId]);
          return newState;
        });
      },

      resetConfig: (agentId) => {
        set((state) => {
          const agentConfig = state.configsByAgentId[agentId];
          if (!agentConfig || !agentConfig.__defaultValues) {
            // If no config or default values exist for this agent, do nothing or set to empty
            return state;
          }
          const defaultsToUse = { ...agentConfig.__defaultValues };
          return {
            configsByAgentId: {
              ...state.configsByAgentId,
              [agentId]: defaultsToUse,
            },
          };
        });
      },

      setDefaultConfig: (agentId, configurations) => {
        const defaultConfig: Record<string, any> = {};
        configurations.forEach((config) => {
          if (config.default !== undefined) {
            defaultConfig[config.label] = config.default;
          }
        });

        defaultConfig.__defaultValues = { ...defaultConfig };

        set((currentState) => {
          // Only set defaults if no existing config exists
          if (currentState.configsByAgentId[agentId]) {
            console.log(`Skipping setDefaultConfig for ${agentId} - config already exists`);
            return currentState;
          }
          
          console.log(`Setting default config for ${agentId}:`, defaultConfig);
          return {
            configsByAgentId: {
              ...currentState.configsByAgentId,
              [agentId]: defaultConfig,
            },
          };
        });
      },

      // Clear everything from the store
      resetStore: () => set({ configsByAgentId: {} }),
    }),
    {
      name: "ai-config-storage", // Keep the same storage key, but manage agents inside
      onRehydrateStorage: () => (state) => {
        console.log("Config store rehydrated from localStorage:", state?.configsByAgentId);
      },
    },
  ),
);
