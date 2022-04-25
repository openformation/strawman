const REPLACEMENTS = [
  {
    match: /(?<!\\)`/,
    replace: "\\`",
  },
  {
    match: /(?<!\\)\${/,
    replace: "\\${",
  },
];

export const addSlashesToStringForUseInTemplateLiteral = (
  strForReplacementsToApply: string,
) =>
  REPLACEMENTS.reduce(
    (strWithReplacementsApplied, { match, replace }) =>
      strWithReplacementsApplied.replaceAll(match, replace),
    strForReplacementsToApply,
  );
