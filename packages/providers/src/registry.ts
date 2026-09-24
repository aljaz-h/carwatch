import type { Provider } from "./types";

/**
 * Central lookup of available marketplace integrations. This is the one place
 * that knows about concrete provider classes — the worker and web app only
 * ever depend on the `Provider` interface and this registry, so adding a new
 * marketplace means writing a new provider module and registering it here,
 * never touching scraping-agnostic code elsewhere in the app.
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, Provider>();

  register(provider: Provider): void {
    this.providers.set(provider.key, provider);
  }

  get(key: string): Provider | undefined {
    return this.providers.get(key);
  }

  getOrThrow(key: string): Provider {
    const provider = this.get(key);
    if (!provider) throw new Error(`No provider registered for key "${key}"`);
    return provider;
  }

  list(): Provider[] {
    return [...this.providers.values()];
  }
}
