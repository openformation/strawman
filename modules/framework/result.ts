type ResultShape<M extends string = string> =
  | { type: `SUCCESS: ${M}` }
  | { type: `ERROR: ${M}` };

export const success = function* <M extends string, R extends ResultShape<M>>(
  res: R
) {
  if (res.type.startsWith("SUCCESS: ")) {
    yield res as Extract<R, { type: `SUCCESS: ${M}` }>;
  }
};

export const failure = function* <M extends string, R extends ResultShape<M>>(
  res: R
) {
  if (res.type.startsWith("ERROR: ")) {
    yield res as Extract<R, { type: `ERROR: ${M}` }>;
  }
};
