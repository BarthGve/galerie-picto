import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Pictogram } from "@/lib/types";

interface Contributor {
  login: string;
  avatarUrl: string;
  count: number;
}

export function NavContributors({
  pictograms,
  selectedContributor,
  onSelectContributor,
}: {
  pictograms: Pictogram[];
  selectedContributor: string | null;
  onSelectContributor: (login: string | null) => void;
}) {
  // Extract unique contributors with counts
  const contributors: Contributor[] = [];
  const seen = new Set<string>();

  for (const picto of pictograms) {
    if (picto.contributor && !seen.has(picto.contributor.githubUsername)) {
      seen.add(picto.contributor.githubUsername);
      contributors.push({
        login: picto.contributor.githubUsername,
        avatarUrl: picto.contributor.githubAvatarUrl,
        count: pictograms.filter(
          (p) =>
            p.contributor?.githubUsername === picto.contributor!.githubUsername,
        ).length,
      });
    }
  }

  if (contributors.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-gradient-primary">Contributeurs</SidebarGroupLabel>
      <SidebarMenu>
        {contributors.map((c) => (
          <SidebarMenuItem key={c.login}>
            <SidebarMenuButton
              isActive={selectedContributor === c.login}
              onClick={() =>
                onSelectContributor(
                  selectedContributor === c.login ? null : c.login,
                )
              }
              tooltip={c.login}
            >
              <img
                src={c.avatarUrl}
                alt={c.login}
                className="size-5 shrink-0 rounded-full ring-1 ring-ring-accent"
              />
              <span>{c.login}</span>
            </SidebarMenuButton>
            <SidebarMenuBadge className="bg-badge-accent-bg text-badge-accent-text border border-badge-accent-border text-[10px] rounded-full px-1.5">
              {c.count}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
