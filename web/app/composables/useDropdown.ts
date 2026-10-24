import type { Ref } from 'vue';

/**
 * Open/close state for a small popup anchored to `root`: closes on Escape (returning focus to the
 * trigger), on a click outside, and whenever the route changes.
 */
export function useDropdown(root: Readonly<Ref<HTMLElement | null>>, trigger: Readonly<Ref<HTMLElement | null>>) {
  const isOpen = ref(false);
  const route = useRoute();

  function close(returnFocus = false): void {
    isOpen.value = false;

    if (returnFocus) {
      trigger.value?.focus();
    }
  }

  function handlePointerDown(event: PointerEvent | MouseEvent): void {
    if (isOpen.value && root.value && !root.value.contains(event.target as Node)) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (isOpen.value && event.key === 'Escape') {
      close(true);
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeydown);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handlePointerDown);
    document.removeEventListener('keydown', handleKeydown);
  });
  watch(
    () => route.fullPath,
    () => close(),
  );

  return { isOpen, close, toggle: () => (isOpen.value = !isOpen.value) };
}
