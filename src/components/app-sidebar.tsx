"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "@/lib/navigation";
import { SearchForm } from "@/components/search-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DatabaseIcon,
  PlusIcon,
  MinusIcon,
  ZapIcon,
} from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <DatabaseIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-heading font-semibold tracking-tight">
                    Database Internals
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PostgreSQL Edition
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((group) => {
              const isGroupActive = pathname.startsWith(group.url);
              return (
                <Collapsible
                  key={group.title}
                  defaultOpen={isGroupActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className="font-medium"
                        title={group.title}
                      >
                        <group.icon className="size-4 shrink-0" />
                        <span className="truncate">
                          {group.shortTitle ?? group.title}
                        </span>
                        <PlusIcon className="ml-auto size-3.5 shrink-0 group-data-[state=open]/collapsible:hidden" />
                        <MinusIcon className="ml-auto size-3.5 shrink-0 group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.url}
                            >
                              <Link href={item.url} title={item.title}>
                                <span className="truncate">
                                  {item.shortTitle ?? item.title}
                                </span>
                                {item.isSimulator && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto shrink-0 gap-0.5 px-1.5 py-0 text-[10px] font-normal"
                                  >
                                    <ZapIcon className="size-2.5" />
                                    Sim
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
