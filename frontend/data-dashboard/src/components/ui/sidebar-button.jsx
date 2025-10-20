'use client';

import { useState } from "react";

export default function SidebarButton({ category, selected, onClick}) {
    const [color, setColor] = useState('silver');



    function handleHighlight(hovering) {
        // console.log("On me!!!");
        // console.log(selected);
        console.log(color);
            if(hovering) {
                setColor('lightgrey');

            }
            else {
                setColor('silver');
            }
    }

    function setSilver() {
        console.log(`selected is ${selected} so color is ${selected ? 'grey' : 'silver'}`);
        setColor('silver');
    }

    function setGrey() {
        console.log(`selected is ${selected} so color is ${selected ? 'grey' : 'lightgrey'}`);
        setColor('lightgrey');
    }

    return <h2 style={{backgroundColor: selected ? 'grey' : color}} onMouseEnter={setSilver} onMouseLeave={setGrey}>{category}</h2>
}