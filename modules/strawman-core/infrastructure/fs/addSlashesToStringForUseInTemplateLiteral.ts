const REPLACEMENTS = [
  {
    match: /(?<!\\)`/g,
    replace: "\\`",
  },
  {
    match: /(?<!\\)\${/g,
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
