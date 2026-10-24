// Stamps the chosen theme on <html> for every render, server and browser alike.
export default defineNuxtPlugin(() => {
  const { theme } = useThemeMode();

  useHead({ htmlAttrs: { 'data-theme': theme } });
});
