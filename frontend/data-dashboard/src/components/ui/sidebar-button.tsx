'use client';

import { useState } from "react";

export default function SidebarButton({ category, selected }: Readonly<{category: string; selected: boolean;}>) {
    const [color, setColor] = useState('silver');



    // function handleHighlight(hovering) {
    //     // console.log("On me!!!");
    //     // console.log(selected);
    //     console.log(color);
    //         if(hovering) {
    //             setColor('lightgrey');

    //         }
    //         else {
    //             setColor('silver');
    //         }
    // }

    // function setSilver() {
    //     console.log(`selected is ${selected} so color is ${selected ? 'grey' : 'silver'}`);
    //     setColor('silver');
    // }

    // function setGrey() {
    //     console.log(`selected is ${selected} so color is ${selected ? 'grey' : 'lightgrey'}`);
    //     setColor('lightgrey');
    // }

    return <h2 className={`my-5 pl-9 transition-colors duration-300 text-[12px] cursor-pointer ${selected ? "bg-orange-500 text-white": "hover:text-orange-500"}`}>{category}</h2>
}