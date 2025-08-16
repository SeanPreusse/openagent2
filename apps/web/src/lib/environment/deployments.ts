import { Deployment } from "@/types/deployment";

/**
 * Loads the provided deployments from the environment variable.
 * @returns {Deployment[]} The list of deployments.
 */
export function getDeployments(): Deployment[] {
  let defaultExists = false;
  const raw = process.env.NEXT_PUBLIC_DEPLOYMENTS || "[]";
  const parsed: Deployment[] = JSON.parse(raw);
  // If running server-side in Docker, map localhost URLs to internal service names
  // Only apply this mapping server-side, never in the browser
  const isServerSide = typeof window === "undefined";
  const inDocker = (process.env.DOCKER_ENV === "true" || process.env.NODE_ENV === "production") && isServerSide;
  const deployments: Deployment[] = parsed.map((d) => {
    try {
      const u = new URL(d.deploymentUrl);
      if (inDocker && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) {
        // Heuristic remap by port to internal service name (server-side only)
        const mappedHost =
          u.port === "2026" ? "oap_tools_agent" : u.port === "2025" ? "open_deep_research" : u.hostname;
        u.hostname = mappedHost;
        d = { ...d, deploymentUrl: u.toString() };
      }
    } catch {}
    return d;
  });
  for (const deployment of deployments) {
    if (deployment.isDefault && !defaultExists) {
      if (!deployment.defaultGraphId) {
        throw new Error("Default deployment must have a default graph ID");
      }
      defaultExists = true;
    } else if (deployment.isDefault && defaultExists) {
      throw new Error("Multiple default deployments found");
    }
  }
  if (!defaultExists) {
    throw new Error("No default deployment found");
  }
  return deployments;
}
