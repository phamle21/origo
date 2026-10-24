/** The project addressed by the current route and a builder for links inside it, locale prefix included. */
export function useProjectRoute() {
  const route = useRoute();
  const localePath = useLocalePath();
  const code = computed(() => String(route.params.code ?? '').toUpperCase());

  function toProjectPath(path = ''): string {
    return localePath(path ? `/p/${code.value}/${path}` : `/p/${code.value}`);
  }

  return { code, toProjectPath };
}
