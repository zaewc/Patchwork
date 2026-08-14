import { shortDate } from "@/lib/format";
import type { ContributionGroup } from "@/lib/github";

function escapeLinkText(title: string): string {
  return title.replace(/[[\]]/g, "\\$&");
}

export function toMarkdown(groups: ContributionGroup[]): string {
  return groups
    .map((group) => {
      const lines = group.items.map(
        (item) =>
          `- \`${shortDate(item.createdAt)}\` **${item.type}** | [${escapeLinkText(item.title)}](${item.url})`,
      );
      return [`### ${group.name}`, "", ...lines].join("\n");
    })
    .join("\n\n");
}
