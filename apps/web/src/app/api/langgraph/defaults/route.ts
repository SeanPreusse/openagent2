import { NextRequest } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { getDeployments } from "@/lib/environment/deployments";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a client for a specific deployment, using either LangSmith auth or user auth
 */
function createLgClient(deploymentId: string, accessToken?: string) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  // Use user auth
  const client = new Client({
    apiUrl: deployment.deploymentUrl,
    defaultHeaders: {
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
            "x-supabase-access-token": accessToken,
          }
        : {}),
    },
  });
  return client;
}

/**
 * Gets or creates default assistants for a deployment
 */
async function getOrCreateDefaultAssistants(
  deploymentId: string,
  accessToken?: string,
) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  // Use only user-scoped auth (no LangSmith admin). If no token, return empty and let UI handle sign-in.
  const userClient = createLgClient(deploymentId, accessToken);

  // Fetch any existing user default assistants
  const userDefaultAssistants = await userClient.assistants.search({
    limit: 100,
    metadata: { _x_oap_is_default: true },
  });

  // Ensure at least one default assistant for the deployment default graph
  const graphsToEnsure: string[] = deployment.defaultGraphId
    ? [deployment.defaultGraphId]
    : [];

  const missingGraphs = graphsToEnsure.filter(
    (graphId) => !userDefaultAssistants.some((a) => a.graph_id === graphId),
  );

  const created: any[] = [];
  for (const graphId of missingGraphs) {
    try {
      const createdAssistant = await userClient.assistants.create({
        graphId,
        name: "Default Assistant",
        metadata: {
          _x_oap_is_default: true,
          _x_oap_is_primary: true,
          description: "Default Assistant",
        },
      });
      created.push(createdAssistant);
    } catch (e) {
      // Ignore create errors; return what we have
    }
  }

  return [...userDefaultAssistants, ...created];
}

/**
 * GET handler for the /api/langgraph/defaults endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const deploymentId = url.searchParams.get("deploymentId");
    let accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");

    // Fall back to Supabase session cookie to obtain user access token
    if (!accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
              get(name: string) {
                return req.cookies.get(name)?.value;
              },
              set() {},
              remove() {},
            },
          });
          const {
            data: { session },
          } = await supabase.auth.getSession();
          accessToken = session?.access_token || undefined;
        } catch {}
      }
    }

    if (!deploymentId) {
      return new Response(
        JSON.stringify({ error: "Missing deploymentId parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // If no access token is available, return 401 so the client can prompt sign-in
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: missing user access token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const defaultAssistants = await getOrCreateDefaultAssistants(
      deploymentId,
      accessToken || undefined,
    );

    return new Response(JSON.stringify(defaultAssistants), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting default assistants:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
