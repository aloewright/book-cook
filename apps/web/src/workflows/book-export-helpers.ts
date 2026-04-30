export type ExportKind = "epub" | "pdf" | "kpf";
export const exportKinds: ExportKind[] = ["epub", "pdf", "kpf"];

export function manuscriptMarkdown(
  title: string,
  rows: { ordinal: number; title: string; summary: string; draft_md: string }[],
): string {
  const chaptersMd = rows
    .map((chapter) => {
      const body = chapter.draft_md.trim() || chapter.summary.trim();
      return `# ${chapter.ordinal}. ${chapter.title}\n\n${body || "_No draft text yet._"}`;
    })
    .join("\n\n");
  return `% ${title}\n\n${chaptersMd}\n`;
}
