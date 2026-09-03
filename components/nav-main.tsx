"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive =
              item.url === "/admin" ? pathname === "/admin" : pathname.startsWith(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  className="rounded-lg font-medium text-sidebar-foreground/70 transition-colors [&_svg]:transition-colors [&_svg]:text-sidebar-foreground/50 data-active:shadow-sm data-active:text-sidebar-accent-foreground data-active:[&_svg]:text-sidebar-primary hover:text-sidebar-accent-foreground hover:[&_svg]:text-sidebar-accent-foreground"
                  render={<Link href={item.url} className="select-none" />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
