 'use client';

import React, { useState } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

type Props = Readonly<{
    category: string;
    selected: boolean;
    editable: boolean;
    handleDelete(): void;
    handleEdit?: (newName: string) => void;
}>;

export default function SidebarButton({ category, selected, editable, handleDelete, handleEdit }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(category);

    function startEdit(e: React.MouseEvent) {
        e.stopPropagation();
        setEditing(true);
    }

    function finishEdit() {
        const v = value.trim();
        if (v && handleEdit) handleEdit(v);
        setEditing(false);
    }

    function cancelEdit() {
        setValue(category);
        setEditing(false);
    }

    if (editing) {
        return (
            <div className="my-2 px-2">
                <input
                    className="w-full rounded bg-white/5 px-3 py-1 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={value}
                    maxLength={24}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={finishEdit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEdit();
                        if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                />
            </div>
        );
    }

    return (
        <h2
            className={`group flex justify-between items-center w-full min-h-[28px] min-w-0 cursor-pointer my-5 pl-9 transition-colors duration-300 text-[12px] ${selected ? 'bg-orange-500 text-white' : 'hover:text-orange-500'}`}
        >
            <span className="flex-1 min-w-0 truncate">{category}</span>

            <div className="flex items-center">
                <div onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                    <TrashIcon className={`${editable ? 'block' : 'hidden'} transition-all text-white w-6 h-6 mr-2 py-1 opacity-0 group-hover:opacity-100 transition-colors duration-300 hover:text-red-500`} />
                </div>
                <div onClick={startEdit}>
                    <PencilIcon className={`${editable ? 'block' : 'hidden'} transition-all text-white w-5 h-5 mr-2 py-1 opacity-0 group-hover:opacity-100 transition-colors duration-300 hover:text-orange-500 cursor-pointer`} />
                </div>
            </div>
        </h2>
    );
}