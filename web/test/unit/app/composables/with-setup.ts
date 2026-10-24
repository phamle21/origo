import { defineComponent, h } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';

/** Runs a composable inside a component's setup, where Nuxt and vue-i18n composables are allowed. */
export async function withSetup<TResult>(composable: () => TResult): Promise<TResult> {
  let result: TResult | undefined;

  await mountSuspended(
    defineComponent({
      setup() {
        result = composable();

        return () => h('div');
      },
    }),
  );

  return result as TResult;
}
