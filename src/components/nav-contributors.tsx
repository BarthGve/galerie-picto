import {
  SidebarGroup,
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
      <div className="px-3 mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contributeurs</span>
      </div>
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
                className="size-5 shrink-0 rounded-full ring-1 ring-border"
              />
              <span className="text-sm font-bold">{c.login}</span>
            </SidebarMenuButton>
            <SidebarMenuBadge className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent peer-hover/menu-button:bg-transparent">
              {c.count}
            </SidebarMenuBadge>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
