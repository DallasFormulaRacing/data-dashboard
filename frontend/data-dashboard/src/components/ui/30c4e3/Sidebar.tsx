'use client';

import { Autour_One } from "next/font/google";
import SidebarButton from "./ButtonSidebar";
import ProfileBox from "./ProfileBox";
import { useState, useRef, useEffect } from "react";
import logo from "../../images/dfr-logo-tyre.png";
import { PlusIcon, ViewColumnsIcon, Bars3Icon, BoltIcon, CpuChipIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const permanent_categories = ['POWERTRAIN', 'EMBEDDED', 'BATTERY'];
  const [clickedCategory, setClickedCategory] = useState('POWERTRAIN');
  const [editable_categories, set_editable_categories] = useState(['A', 'B', 'C']);
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleClick(preset: string) {
    setClickedCategory(preset);
  }

  function handleDelete(categoryToDelete: string) {
    console.log("deleting " + categoryToDelete);
    set_editable_categories(editable_categories.filter(c => c !== categoryToDelete));
  }

  useEffect(() => {
    if (adding) {
      // focus the input when adding starts
      inputRef.current?.focus();
    }
  }, [adding]);

  function handleAddClick() {
    if (collapsed) setCollapsed(false);
    setAdding(true);
  }

  function finalizeNewCategory() {
    const name = newCategory.trim();
    if (name) {
      if (!editable_categories.includes(name)) {
        set_editable_categories(prev => [...prev, name]);
      }
      setClickedCategory(name);
    }
    setNewCategory('');
    setAdding(false);
  }

  function cancelNewCategory() {
    setNewCategory('');
    setAdding(false);
  }

  function handleRename(oldName: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    set_editable_categories(prev => prev.map(c => c === oldName ? trimmed : c));
    if (clickedCategory === oldName) setClickedCategory(trimmed);
  }

  const iconMap: { [k: string]: any } = {
    POWERTRAIN: Cog6ToothIcon,
    EMBEDDED: CpuChipIcon,
    BATTERY: BoltIcon,
  };

  return (
    <div className={`dark bg-background text-foreground font-bold ${collapsed ? 'w-20' : 'w-[200px]'} h-screen flex flex-col py-4 transition-all duration-200`}> 
      {/* Top row: small logo + collapse toggle */}
      <div className="flex items-center px-2 mb-2 ml-2 gap-3">
        <img src={logo.src} alt="DFR Logo" className={`${collapsed ? 'hidden' : ''} h-auto w-8`} />
        <button aria-label="collapse sidebar" onClick={() => setCollapsed(!collapsed)} className={`rounded hover:text-orange-500 ${collapsed ? 'pl-2' : ''}`}>
          <Bars3Icon className="h-8 w-auto" />
        </button>
        <button onClick={handleAddClick} className={`flex items-center justify-center bg-black text-white text-[25px] cursor-pointer rounded-full hover:text-orange-500 active:bg-gray-800 ${collapsed ? 'hidden' : 'w-8 h-auto'}`}>
          <PlusIcon />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* {!collapsed && <h1 className="text-[18px] mb-3 mx-0 px-4">Presets</h1>} */}

        <div className="w-full flex-1 overflow-y-auto mt-3">
          {permanent_categories.map((preset) => {
            const Icon = iconMap[preset];
            return (
              <div key={preset} onClick={() => handleClick(preset)} className={`${collapsed ? 'h-10 flex items-center justify-center' : ''}`}>
                {collapsed ? (
                  <Icon className={`w-6 h-6 ${clickedCategory === preset ? 'text-orange-500' : 'text-gray-400'} hover:text-orange-500 transition-colors duration-200 cursor-pointer`} />
                ) : (
                  <div>
                    <SidebarButton selected={clickedCategory === preset} category={preset} editable={false} handleDelete={() => { }} />
                    {/* <Icon className={`w-6 h-6 ${clickedCategory === preset ? 'text-orange-500' : 'text-gray-400'} hover:text-orange-500 transition-colors duration-200 cursor-pointer`} /> */}
                  </div>
                )}
              </div>
            );
          })}
          <div className="h-10 w-full"></div>
          {editable_categories.map((preset) => (
            <div key={preset} className={`${collapsed ? 'h-10 flex items-center justify-center' : ''}`} onClick={!collapsed ? () => handleClick(preset) : undefined}>
              {collapsed ? (
                  <div onClick={() => handleClick(preset)} className={`w-8 h-8 rounded-full bg-black border flex items-center justify-center text-sm ${clickedCategory === preset ? 'border-orange-500 text-orange-500' : 'border-white text-white'} hover:border-orange-500 hover:text-orange-500 transition-colors duration-200 cursor-pointer`}>{preset.charAt(0).toUpperCase()}</div>
                ) : (
                <SidebarButton selected={clickedCategory === preset} category={preset} editable={true} handleDelete={() => { handleDelete(preset) }} handleEdit={(newName: string) => { handleRename(preset, newName) }} />
              )}
            </div>
          ))}

          {adding && (
            <div className="my-2 px-2">
              <input
                ref={inputRef}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onBlur={finalizeNewCategory}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    finalizeNewCategory();
                  } else if (e.key === 'Escape') {
                    cancelNewCategory();
                  }
                }}
                placeholder="New category"
                className="w-full rounded bg-white/5 px-3 py-1 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          )}
        </div>

        <div className="mt-auto px-2">
          <ProfileBox collapsed={collapsed} name={"Anhaar W"} onLogout={() => { console.log('logout') }} />
        </div>
      </div>
    </div>
    
    
  );
}