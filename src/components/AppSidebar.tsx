import { useLocation, useNavigate } from "react-router-dom";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, isAdminOrEnablement, getRoleLabel } from "@/lib/rbac/permissions";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2,
  Kanban,
  Users,
  Settings,
  Puzzle,
  Zap,
  LogOut,
  Building,
  Store,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: profile, isLoading } = useCurrentProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);
  const role = profile?.role;
  const showAdmin = isAdminOrEnablement(role ?? null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Interno", url: "/internal", icon: Building, show: true },
    { title: "Franquias", url: "/franchise", icon: Store, show: true },
  ];

  const adminItems = [
    { title: "Usuários", url: "/admin/users", icon: Users },
    { title: "Unidades", url: "/admin/business-units", icon: Building2 },
    { title: "Pipelines", url: "/admin/pipelines", icon: Kanban },
    { title: "Automações", url: "/admin/automations", icon: Zap },
    { title: "Integrações", url: "/admin/integrations", icon: Puzzle },
    { title: "Templates", url: "/admin/templates", icon: FileText },
    { title: "Start Forms", url: "/admin/start-forms", icon: FileText },
  ];

  if (isLoading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-3/4" />
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4">
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-primary-foreground">
              O2 <span className="text-sidebar-primary">CRM</span>
            </span>
          )}
          {collapsed && (
            <span className="text-lg font-bold text-sidebar-primary">O2</span>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin nav */}
        {showAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && profile && (
          <div className="space-y-2">
            <div className="text-xs text-sidebar-foreground truncate">
              {profile.fullName}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] border-sidebar-border text-sidebar-foreground">
                {profile.role ? getRoleLabel(profile.role) : "—"}
              </Badge>
              {profile.buName && (
                <Badge variant="outline" className="text-[10px] border-sidebar-border text-sidebar-foreground">
                  {profile.buName}
                </Badge>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
