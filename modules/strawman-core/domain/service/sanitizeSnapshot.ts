const SANITIZATIONS = [
  {
    match: /(?<!\\)`/g,
    replace: "/`",
  },
  {
    match: /(?<!\\)\${/g,
    replace: "/${",
  },
];

export const sanitizeSnapshotContent = (snapshotContent: string) =>
  SANITIZATIONS.reduce(
    (sanitizedContent, { match, replace }) =>
      sanitizedContent.replace(match, replace),
    snapshotContent,
  );
