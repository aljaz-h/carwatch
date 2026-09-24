import { AvtoNetProvider } from "./providers/avto-net/index";
import { DemoProvider } from "./providers/demo/index";
import { ProviderRegistry } from "./registry";

/** Providers shipped out of the box. Add a new marketplace by registering it here. */
export function createDefaultRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.register(new AvtoNetProvider());
  registry.register(new DemoProvider());
  return registry;
}
