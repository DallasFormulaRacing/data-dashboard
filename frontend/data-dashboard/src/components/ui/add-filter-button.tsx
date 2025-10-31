'use client';

import { useState } from "react";
import FilterModal from "./filter-modal";
export default function AddFilterButton() {

    // const [color, setColor] = useState("lightgrey");
    const [modalOpen, setModalOpen] = useState(false);
    return ( <button className={`pb-2 flex items-center justify-center bg-white border border-gray-600 text-gray-600 text-[30px] cursor-pointer rounded-full mb-1.5 hover:bg-gray-200 active:bg-gray-300 w-10 h-10`}
    onClick={() => {
        setModalOpen(true);
        console.log("hi")}}>
    +</button>)
    // {modalOpen ? <FilterModal /> : null})

    
    
}