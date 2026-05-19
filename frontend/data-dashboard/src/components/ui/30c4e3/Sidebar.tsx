'use client';

import SidebarButton from "./ButtonSidebar";
import ProfileBox from "./ProfileBox";
import { useState, useRef, useEffect } from "react";
import logo from "../../images/dfr-logo-tyre.png";
import { PlusIcon, BoltIcon, CpuChipIcon, Cog6ToothIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

export default function Sidebar() {
  const defaultTabs = ['POWERTRAIN', 'EMBEDDED', 'BATTERY'];
  const [availableTabs, setAvailableTabs] = useState<string[]>(defaultTabs);
  const [customTabs, setCustomTabs] = useState<string[]>([]);
  const [clickedCategory, setClickedCategory] = useState('POWERTRAIN');
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { open, setOpen } = useSidebar();

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
    window.dispatchEvent(new Event('dashboard-preset-clicked'));
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
    if (!open) setOpen(true);
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
      window.dispatchEvent(new Event('dashboard-preset-clicked'));
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
    window.dispatchEvent(new Event('dashboard-preset-clicked'));
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
    <ShadcnSidebar collapsible="icon" className="dark bg-black border-r-0">
      <SidebarHeader className="p-4 pt-6 pb-2 flex items-center justify-center">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="w-full">
            {open ? (
              <div className="flex items-center justify-between w-full px-2 h-8">
                <img src={logo.src} alt="DFR Logo" className="h-8 w-auto flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md hover:bg-sidebar-accent text-white/70 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  title="Collapse Sidebar"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-8">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="p-1 rounded-md hover:bg-sidebar-accent text-white/70 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  title="Expand Sidebar"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="transition-[padding] duration-200 group-data-[state=expanded]:pl-4 group-data-[state=expanded]:pr-6 group-data-[state=collapsed]:px-2">
          <SidebarGroupLabel className="text-sidebar-foreground/50 font-bold uppercase tracking-wider text-[10px] group-data-[collapsible=icon]:mt-0">Presets</SidebarGroupLabel>
          <SidebarGroupAction title="Add Preset" onClick={handleAddClick} className="hover:bg-orange-500/20 hover:text-orange-500 transition-colors group-data-[state=expanded]:right-6">
            <PlusIcon /> <span className="sr-only">Add Preset</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {availableTabs.map((preset) => (
                <SidebarButton
                  key={preset}
                  selected={clickedCategory === preset}
                  category={preset}
                  editable={customTabs.includes(preset)}
                  onClick={() => handleClick(preset)}
                  handleDelete={() => handleDelete(preset)}
                  handleEdit={(newName: string) => handleRename(preset, newName)}
                  icon={!customTabs.includes(preset) ? iconMap[preset] : undefined}
                />
              ))}

              {adding && (
                <SidebarMenuItem>
                  <div className="px-2 py-1 w-full">
                    <input
                      ref={inputRef}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onBlur={finalizeNewCategory}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finalizeNewCategory();
                        else if (e.key === 'Escape') cancelNewCategory();
                      }}
                      placeholder="New category"
                      className="w-full rounded bg-sidebar-accent border border-sidebar-border px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-500 text-white placeholder:text-gray-500"
                    />
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <ProfileBox name="Anhaar W" onLogout={() => console.log('logout')} />
      </SidebarFooter>
    </ShadcnSidebar>
  );
}