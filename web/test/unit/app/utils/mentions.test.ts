import { describe, expect, test } from 'vitest';
import { keptMentions, mentionQueryAt, splitMentions } from '@/utils/mentions';

const people = [
  { id: 1, name: 'Minh' },
  { id: 2, name: 'Minh Anh' },
];

describe('mentions', () => {
  test('splits tags out of the text, longest name first', () => {
    expect(splitMentions('Hỏi @Minh Anh và @Minh nhé, mail a@b', people)).toEqual([
      { text: 'Hỏi ' },
      { text: '@Minh Anh', mentionId: 2 },
      { text: ' và ' },
      { text: '@Minh', mentionId: 1 },
      { text: ' nhé, mail a@b' },
    ]);
    expect(splitMentions('Không ai', [])).toEqual([{ text: 'Không ai' }]);
  });

  test('finds the @query being typed only at a word start and on one line', () => {
    expect(mentionQueryAt('Hỏi @Min', 8)).toEqual({ start: 4, query: 'Min' });
    expect(mentionQueryAt('@', 1)).toEqual({ start: 0, query: '' });
    expect(mentionQueryAt('mail a@b', 8)).toBeNull();
    expect(mentionQueryAt('@Minh\nAnh', 9)).toBeNull();
  });

  test('keeps only the tags still written in the text', () => {
    expect(keptMentions('@Minh Anh xem', people)).toEqual([2]);
    expect(keptMentions('@Minh và @Minh Anh', people)).toEqual([1, 2]);
    expect(keptMentions('xóa tag rồi', people)).toEqual([]);
  });
});
