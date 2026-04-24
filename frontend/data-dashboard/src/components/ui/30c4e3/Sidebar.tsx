'use client';

import SidebarButton from "./ButtonSidebar";
import ProfileBox from "./ProfileBox";
import { useState, useRef, useEffect } from "react";
import logo from "../../images/dfr-logo-tyre.png";
import { PlusIcon, Bars3Icon, BoltIcon, CpuChipIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const defaultTabs = ['POWERTRAIN', 'EMBEDDED', 'BATTERY'];
  const [availableTabs, setAvailableTabs] = useState<string[]>(defaultTabs);
  const [customTabs, setCustomTabs] = useState<string[]>([]);
  const [clickedCategory, setClickedCategory] = useState('POWERTRAIN');
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ensurePermanentTabs = (tabs: string[]) => {
    const cleaned = tabs
      .map((value) => String(value).trim())
      .filter((value, index, self) => value.length > 0 && self.indexOf(value) === index);

    const custom = cleaned.filter((tab) => !defaultTabs.includes(tab));
    return [...defaultTabs, ...custom];
  };

  const emitTabsUpdated = (tabs: string[]) => {
    const nextTabs = ensurePermanentTabs(tabs);
    const nextCustomTabs = nextTabs.filter((tab) => !defaultTabs.includes(tab));
    localStorage.setItem('dashboardTabs', JSON.stringify(nextTabs));
    localStorage.setItem('dashboardCustomTabs', JSON.stringify(nextCustomTabs));
    window.dispatchEvent(new CustomEvent('dashboard-tabs-updated', { detail: nextTabs }));
  };

  function handleClick(preset: string) {
    setClickedCategory(preset);
    window.dispatchEvent(new CustomEvent('dashboard-tab-selected', { detail: preset }));
  }

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    POWERTRAIN: Cog6ToothIcon,
    EMBEDDED: CpuChipIcon,
    BATTERY: BoltIcon,
  };

  useEffect(() => {
    const syncTabs = () => {
      const rawTabs = localStorage.getItem('dashboardTabs');
      const rawCustomTabs = localStorage.getItem('dashboardCustomTabs');

      let baseTabs = defaultTabs;
      let storedCustomTabs: string[] = [];
      let hasStoredTabs = false;

      if (rawTabs) {
        try {
          const parsed = JSON.parse(rawTabs) as unknown;
          if (Array.isArray(parsed)) {
            const cleaned = parsed.map((value) => String(value).trim()).filter((value) => value.length > 0);
            if (cleaned.length) {
              baseTabs = ensurePermanentTabs(cleaned);
              hasStoredTabs = true;
            }
          }
        } catch {
          baseTabs = defaultTabs;
        }
      }

      if (hasStoredTabs) {
        // dashboardTabs is authoritative when present (it mirrors graphdata.json).
        storedCustomTabs = baseTabs.filter((tab) => !defaultTabs.includes(tab));
      } else if (rawCustomTabs) {
        try {
          const parsed = JSON.parse(rawCustomTabs) as unknown;
          if (Array.isArray(parsed)) {
            storedCustomTabs = parsed
              .map((value) => String(value).trim())
              .filter((value) => value.length > 0 && !defaultTabs.includes(value));
          }
        } catch {
          storedCustomTabs = [];
        }
      }

      if (!storedCustomTabs.length) {
        storedCustomTabs = baseTabs.filter((tab) => !defaultTabs.includes(tab));
      }

      const mergedTabs = ensurePermanentTabs([...baseTabs, ...storedCustomTabs]);
      setCustomTabs(storedCustomTabs);
      setAvailableTabs(mergedTabs.length ? mergedTabs : defaultTabs);
    };

    const handleTabsUpdated = (event: Event) => {
      const fromEvent = (event as CustomEvent<string[]>).detail;
      if (Array.isArray(fromEvent) && fromEvent.length) {
        const cleaned = ensurePermanentTabs(fromEvent);
        if (cleaned.length) {
          setAvailableTabs(cleaned);
          setCustomTabs(cleaned.filter((tab) => !defaultTabs.includes(tab)));
          return;
        }
      }
      syncTabs();
    };

    syncTabs();
    window.addEventListener('dashboard-tabs-updated', handleTabsUpdated);

    return () => {
      window.removeEventListener('dashboard-tabs-updated', handleTabsUpdated);
    };
  }, []);

  useEffect(() => {
    if (!availableTabs.length) return;
    if (!availableTabs.includes(clickedCategory)) {
      const next = availableTabs[0];
      setClickedCategory(next);
      window.dispatchEvent(new CustomEvent('dashboard-tab-selected', { detail: next }));
    }
  }, [availableTabs, clickedCategory]);

  useEffect(() => {
    if (adding) {
      inputRef.current?.focus();
    }
  }, [adding]);

  function handleAddClick() {
    if (collapsed) setCollapsed(false);
    setAdding(true);
  }

  function finalizeNewCategory() {
    const name = newCategory.trim();
    if (!name) {
      setNewCategory('');
      setAdding(false);
      return;
    }

    if (availableTabs.includes(name)) {
      setClickedCategory(name);
      window.dispatchEvent(new CustomEvent('dashboard-tab-selected', { detail: name }));
      setNewCategory('');
      setAdding(false);
      return;
    }

    const nextCustomTabs = [...customTabs, name];
    const nextTabs = [...availableTabs, name];
    setCustomTabs(nextCustomTabs);
    setAvailableTabs(nextTabs);
    localStorage.setItem('dashboardCustomTabs', JSON.stringify(nextCustomTabs));
    emitTabsUpdated(nextTabs);
    setClickedCategory(name);
    window.dispatchEvent(new CustomEvent('dashboard-tab-selected', { detail: name }));
    setNewCategory('');
    setAdding(false);
  }

  function cancelNewCategory() {
    setNewCategory('');
    setAdding(false);
  }

  function handleDelete(categoryToDelete: string) {
    if (!customTabs.includes(categoryToDelete)) return;

    const nextCustomTabs = customTabs.filter((tab) => tab !== categoryToDelete);
    const nextTabs = availableTabs.filter((tab) => tab !== categoryToDelete);

    setCustomTabs(nextCustomTabs);
    setAvailableTabs(nextTabs);
    localStorage.setItem('dashboardCustomTabs', JSON.stringify(nextCustomTabs));
    emitTabsUpdated(nextTabs);

    if (clickedCategory === categoryToDelete && nextTabs.length) {
      const next = nextTabs[0];
      setClickedCategory(next);
      window.dispatchEvent(new CustomEvent('dashboard-tab-selected', { detail: next }));
    }
  }

  function handleRename(oldName: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || availableTabs.includes(trimmed)) return;
    if (!customTabs.includes(oldName)) return;

    const nextCustomTabs = customTabs.map((tab) => (tab === oldName ? trimmed : tab));
    const nextTabs = availableTabs.map((tab) => (tab === oldName ? trimmed : tab));

    setCustomTabs(nextCustomTabs);
    setAvailableTabs(nextTabs);
    localStorage.setItem('dashboardCustomTabs', JSON.stringify(nextCustomTabs));
    window.dispatchEvent(new CustomEvent('dashboard-tab-renamed', { detail: { oldName, newName: trimmed } }));
    emitTabsUpdated(nextTabs);

    if (clickedCategory === oldName) {
      setClickedCategory(trimmed);
      window.dispatchEvent(new CustomEvent('dashboard-tab-selected', { detail: trimmed }));
    }
  }

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
          {availableTabs.map((preset) => {
            const Icon = iconMap[preset];
            const isEditable = customTabs.includes(preset);
            return (
              <div key={preset} onClick={() => handleClick(preset)} className={`${collapsed ? 'h-10 flex items-center justify-center' : ''}`}>
                {collapsed ? (
                  Icon ? (
                    <Icon className={`w-6 h-6 ${clickedCategory === preset ? 'text-orange-500' : 'text-gray-400'} hover:text-orange-500 transition-colors duration-200 cursor-pointer`} />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-black border flex items-center justify-center text-sm ${clickedCategory === preset ? 'border-orange-500 text-orange-500' : 'border-white text-white'} hover:border-orange-500 hover:text-orange-500 transition-colors duration-200 cursor-pointer`}>
                      {preset.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <div>
                    <SidebarButton
                      selected={clickedCategory === preset}
                      category={preset}
                      editable={isEditable}
                      handleDelete={() => { handleDelete(preset) }}
                      handleEdit={(newName: string) => { handleRename(preset, newName) }}
                    />
                  </div>
                )}
              </div>
            );
          })}

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