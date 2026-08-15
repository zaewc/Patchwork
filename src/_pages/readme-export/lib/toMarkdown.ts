import type { ContributionGroup } from "@/entities/contribution";
import { shortDate } from "@/shared/lib/format";

/** 제목에 든 대괄호를 그대로 두면 Markdown 링크가 깨진다. */
function escapeLinkText(title: string): string {
  return title.replace(/[[\]]/g, "\\$&");
}

/** 기여 묶음을 README에 그대로 붙일 수 있는 Markdown으로 옮긴다. */
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
