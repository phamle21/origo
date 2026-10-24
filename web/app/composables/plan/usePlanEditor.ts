/**
 * Runs plan writes one at a time from the user's point of view: each write reloads the plan afterwards,
 * and the latest failure is shown as one localized message above the chart.
 */
export function usePlanEditor(refresh: () => Promise<unknown>) {
  const request = useAppRequest(async (operation: () => Promise<unknown>) => {
    await operation();

    return true as const;
  });

  async function run(operation: () => Promise<unknown>): Promise<boolean> {
    const result = await request.execute(operation);

    await refresh();

    return result === true;
  }

  return { run, errorMessage: request.errorMessage, isPending: request.isPending, reset: request.reset };
}
