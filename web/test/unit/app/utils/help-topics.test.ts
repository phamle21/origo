import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { findHelpTopic, HELP_TOPICS } from '@/utils/help-topics';
import en from '~~/i18n/locales/en/help';
import ja from '~~/i18n/locales/ja/help';
import vi from '~~/i18n/locales/vi/help';

type Messages = typeof vi;

const LOCALES: [string, Messages][] = [
  ['vi', vi],
  ['en', en as Messages],
  ['ja', ja as Messages],
];

describe('help topics', () => {
  test('have unique topic ids and unique step ids within a topic', () => {
    expect(new Set(HELP_TOPICS.map((topic) => topic.id)).size).toBe(HELP_TOPICS.length);
    for (const topic of HELP_TOPICS) {
      expect(new Set(topic.steps.map((step) => step.id)).size).toBe(topic.steps.length);
    }
  });

  test.each(LOCALES)('every topic and step has its words in %s', (_locale, messages) => {
    const topics = messages.topics as Record<string, { title: string; summary: string; steps: Record<string, { title: string; text: string; tip?: string }> }>;

    for (const topic of HELP_TOPICS) {
      expect(topics[topic.id]?.title, topic.id).toBeTruthy();
      expect(topics[topic.id]?.summary, topic.id).toBeTruthy();

      for (const step of topic.steps) {
        const words = topics[topic.id]?.steps[step.id];

        expect(words?.title, `${topic.id}.${step.id}`).toBeTruthy();
        expect(words?.text, `${topic.id}.${step.id}`).toBeTruthy();
        expect(Boolean(words?.tip), `${topic.id}.${step.id} tip`).toBe(Boolean(step.hasTip));
      }
    }
  });

  test('every step picture exists in public/images/help', () => {
    for (const step of HELP_TOPICS.flatMap((topic) => topic.steps)) {
      expect(step.image && existsSync(resolve('public', step.image.slice(1))), step.image ?? '').toBe(true);
    }
  });

  test('finds a topic by id and nothing for an unknown one', () => {
    expect(findHelpTopic('plan-edit')?.audience).toBe('editors');
    expect(findHelpTopic('nope')).toBeNull();
  });
});
