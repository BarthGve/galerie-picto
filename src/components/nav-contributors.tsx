import { useMemo } from "react";
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
  const contributors = useMemo<Contributor[]>(() => {
    const countMap = new Map<string, { avatarUrl: string; count: number }>();
    for (const picto of pictograms) {
      if (!picto.contributor) continue;
      const { githubUsername, githubAvatarUrl } = picto.contributor;
      const entry = countMap.get(githubUsername);
      if (entry) {
        entry.count++;
      } else {
        countMap.set(githubUsername, { avatarUrl: githubAvatarUrl, count: 1 });
      }
    }
    return Array.from(countMap.entries()).map(([login, { avatarUrl, count }]) => ({
      login,
      avatarUrl,
      count,
    }));
  }, [pictograms]);

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
