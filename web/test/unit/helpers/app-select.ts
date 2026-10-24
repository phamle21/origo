import { flushPromises, type VueWrapper } from '@vue/test-utils';

// Drives an AppSelect the way a person does: open the box, read the list, pick a line.
type Wrapper = Pick<VueWrapper, 'findAll'>;

function triggerAt(wrapper: Wrapper, index: number) {
  const trigger = wrapper.findAll('button[role="combobox"]').at(index);

  if (!trigger) {
    throw new Error(`No select box at index ${index}`);
  }

  return trigger;
}

export async function openSelect(wrapper: Wrapper, index = 0): Promise<void> {
  await triggerAt(wrapper, index).trigger('click');
  await flushPromises();
}

/** The labels of the open list, in order. */
export function optionLabels(wrapper: Wrapper): string[] {
  return wrapper.findAll('[role="option"]').map((option) => option.find('span span').text());
}

export function selectedLabel(wrapper: Wrapper, index = 0): string {
  return triggerAt(wrapper, index).find('span').text();
}

export async function chooseOption(wrapper: Wrapper, label: string, index = 0): Promise<void> {
  if (!wrapper.findAll('[role="listbox"]').length) {
    await openSelect(wrapper, index);
  }

  const option = wrapper.findAll('[role="option"]').find((candidate) => candidate.find('span span').text() === label);

  if (!option) {
    throw new Error(`No option "${label}" in [${optionLabels(wrapper).join(', ')}]`);
  }

  await option.trigger('mousedown');
  await flushPromises();
}
