'use client';

import React, { useState } from 'react';
import { BoltIcon, CpuChipIcon, Cog6ToothIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { MoreHorizontal } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

type Props = {
    category: string;
    selected: boolean;
    editable: boolean;
    handleDelete(): void;
    handleEdit?: (newName: string) => void;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
};

export default function SidebarButton({ category, selected, editable, handleDelete, handleEdit, onClick, icon: CategoryIcon }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(category);

    function finishEdit() {
        const v = value.trim();
        if (v && handleEdit) handleEdit(v);
        setEditing(false);
    }

    if (editing) {
        return (
            <SidebarMenuItem>
                <div className="px-2 py-1 w-full">
                    <input
                        className="w-full rounded bg-sidebar-accent border border-sidebar-border px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-500 text-white"
                        value={value}
                        maxLength={24}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={finishEdit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') finishEdit();
                            if (e.key === 'Escape') {
                                setValue(category);
                                setEditing(false);
                            }
                        }}
                        autoFocus
                    />
                </div>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={selected} 
              onClick={onClick} 
              tooltip={category}
              className="text-white/60 hover:text-white hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white h-10 transition-colors"
            >
                {CategoryIcon && <CategoryIcon className="size-5 text-white/60 group-hover:text-white group-data-[active=true]:text-white" />}
                <span className="font-semibold tracking-wide">{category}</span>
            </SidebarMenuButton>

            {editable && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuAction className="hover:bg-sidebar-accent hover:text-orange-500 data-[state=open]:bg-sidebar-accent data-[state=open]:text-orange-500 mr-1">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">More</span>
                        </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="dark w-48 bg-black/90 backdrop-blur-md border border-white/20">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="cursor-pointer font-medium hover:text-orange-500">
                            <PencilIcon className="mr-2 size-4" />
                            <span>Rename Preset</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="cursor-pointer font-medium text-red-500 focus:text-red-500 focus:bg-red-500/10">
                            <TrashIcon className="mr-2 size-4" />
                            <span>Delete Preset</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </SidebarMenuItem>
    );
}