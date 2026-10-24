import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'x-request-id';

// The id is always generated here: accepting a client-supplied value would let a caller forge or
// collide correlation ids across unrelated requests in the logs.
export default defineEventHandler((event) => {
  const requestId = randomUUID();

  event.context.requestId = requestId;
  setResponseHeader(event, REQUEST_ID_HEADER, requestId);
});
