'use client';

import { Autour_One } from "next/font/google";
import SidebarButton from "./sidebar-button";
import { useState } from "react";

export default function Sidebar() {
    var categories = ['Powertrain', 'Embedded', 'Battery'];

    const [clickedCategory, setClickedCategory] = useState('Powertrain');

    function handleClick (subteam) {
        setClickedCategory(subteam);
        // console.log(subteam);
    }

    return <div style={{backgroundColor: 'lightgrey', width: 200, height: 1000}}>
        <h1 style={{fontSize: 25}}>Subteams</h1>
            {categories.map((subteam) => (
                <div key={subteam} onClick={() => {handleClick(subteam)}}>    
                <br></br><SidebarButton selected={clickedCategory == subteam ? true : false} category={subteam} /> 
                </div>
             ))
    }</div>
}