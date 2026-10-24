export default defineNuxtPlugin({
  name: 'api-transport',

  setup() {
    // Built once per request so an SSR call carries the visitor's cookie. A module-scope client is
    // created at import time and would share one request context across visitors.
    const headers = useRequestHeaders(['cookie']);

    const apiFetch = $fetch.create({
      // Nitro serves the endpoints under the application base URL, so a subpath deployment must not
      // fall back to the domain root.
      baseURL: useRuntimeConfig().app.baseURL,
      retry: 0,
      headers: import.meta.server ? headers : undefined,
    });

    return {
      provide: { apiFetch },
    };
  },
});
