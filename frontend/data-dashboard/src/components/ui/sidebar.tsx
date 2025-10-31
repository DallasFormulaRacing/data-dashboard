'use client';

import { Autour_One } from "next/font/google";
import SidebarButton from "./sidebar-button";
import { useState } from "react";
import logo from "../../../../../dfr-logo-tyre.png";

export default function Sidebar() {
  const categories = ['POWERTRAIN', 'EMBEDDED', 'BATTERY'];
  const [clickedCategory, setClickedCategory] = useState('POWERTRAIN');

  function handleClick(subteam: string) {
    setClickedCategory(subteam);
  }

  return (
    <div className="dark bg-background text-foreground font-bold w-[200px] h-screen flex flex-col items-center py-6">
      <img className="w-24 h-auto block mx-auto mb-6" src={logo.src} alt="DFR Logo"/>

      {/* Subteams list */}
      <div className="w-full">
        <h1 className="text-[18px] mb-3 mx-0 px-6">SUBTEAMS</h1>
        {categories.map((subteam) => (
          <div key={subteam} onClick={() => handleClick(subteam)}>
            <SidebarButton selected={clickedCategory === subteam} category={subteam} />
          </div>
        ))}
      </div>
    </div>
  );
}