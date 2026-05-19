'use client';

import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function ProfileBox({ name = 'User', onLogout }: { name?: string, onLogout?: () => void }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group hover:bg-sidebar-accent">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white border border-white/20">
            {initial}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight ml-1">
            <span className="truncate font-semibold text-white">{name}</span>
          </div>
          <ArrowRightOnRectangleIcon 
            onClick={(e) => { e.stopPropagation(); onLogout?.(); }} 
            className="ml-auto size-5 text-sidebar-foreground/50 group-hover:text-red-500 transition-colors" 
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
