import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function Topbar() {
  const { data: profile } = useCurrentProfile();

  return (
    <header className="h-14 flex items-center gap-3 border-b bg-card px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1" />
      {profile && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{profile.orgName}</span>
          {profile.orgType === "franchise" && (
            <Badge variant="secondary" className="text-xs">Franquia</Badge>
          )}
        </div>
      )}
    </header>
  );
}
