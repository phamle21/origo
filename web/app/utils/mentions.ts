/** A person who can be tagged with @ in a comment. */
export interface Mentionable {
  id: number;
  name: string;
}

export interface TextSegment {
  text: string;
  /** Set when this piece is an "@Name" of a tagged person. */
  mentionId?: number;
}

/**
 * Splits a comment into plain text and "@Name" pieces for the people tagged in it, longest names
 * first so "@Minh Anh" wins over "@Minh". Text that only looks like a tag stays plain.
 */
export function splitMentions(text: string, mentions: Mentionable[]): TextSegment[] {
  const names = [...mentions].sort((left, right) => right.name.length - left.name.length);
  const segments: TextSegment[] = [];
  let plain = '';
  let index = 0;

  while (index < text.length) {
    const mention = text[index] === '@' ? names.find((person) => text.startsWith(`@${person.name}`, index)) : undefined;

    if (mention) {
      if (plain) {
        segments.push({ text: plain });
        plain = '';
      }
      segments.push({ text: `@${mention.name}`, mentionId: mention.id });
      index += mention.name.length + 1;
    } else {
      plain += text[index];
      index += 1;
    }
  }

  if (plain) {
    segments.push({ text: plain });
  }

  return segments;
}

/**
 * The "@query" being typed right before the caret, or null. The @ must start the text or follow a
 * space or line break, and the query may hold spaces (names do) but not a line break.
 */
export function mentionQueryAt(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf('@');

  if (at < 0 || (at > 0 && !/\s/.test(before[at - 1] ?? ''))) {
    return null;
  }

  const query = before.slice(at + 1);

  return query.includes('\n') || query.length > 40 ? null : { start: at, query };
}

/** The tagged people whose "@Name" is still in the text, e.g. after the writer edited it. */
export function keptMentions(text: string, picked: Mentionable[]): number[] {
  return [...new Set(splitMentions(text, picked).flatMap((segment) => (segment.mentionId === undefined ? [] : [segment.mentionId])))];
}
