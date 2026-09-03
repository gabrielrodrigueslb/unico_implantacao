"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { AdminUser } from "@/features/auth/types"
import {
  LayoutDashboardIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"

const baseNavMain = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Implantações",
    url: "/admin/implantations",
    icon: <ListChecksIcon />,
  },
]

const adminOnlyNavItems = [
  {
    title: "Usuários",
    url: "/admin/users",
    icon: <UsersIcon />,
  },
  {
    title: "Auditoria",
    url: "/admin/audit-logs",
    icon: <ShieldCheckIcon />,
  },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: AdminUser }) {
  // Gestão de usuários e auditoria são só para ADMIN — a API já recusa
  // (403/visão restrita) pra MEMBER, isto só evita levar quem não pode
  // gerenciar até uma página vazia.
  const navMain = user.role === "ADMIN" ? [...baseNavMain, ...adminOnlyNavItems] : baseNavMain
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:bg-sidebar-accent"
              render={<Link href="/admin" />}
            >
              <Image
                src="/logounico_azul.svg"
                alt="Único"
                width={110}
                height={33}
                className="h-6 w-auto group-data-[collapsible=icon]:hidden dark:hidden"
                priority
              />
              <Image
                src="/logounico_branca.svg"
                alt="Único"
                width={110}
                height={33}
                className="hidden h-6 w-auto group-data-[collapsible=icon]:hidden dark:block"
                priority
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
