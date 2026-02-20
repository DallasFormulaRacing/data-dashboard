import { Bar, BarChart } from "recharts"
import ButtonAddFilter from "./ButtonAddFilter"
 

export default function BlankGraph() { 
    return ( 
    <div>
        <ButtonAddFilter />
        <div className="bg-white rounded-lg h-125 w-full border-2 border-gray-400 flex items-center justify-center mb-4">
            <h1 className="text-xl text-gray-500 italic">Insert Graph Here</h1>
        </div>
    </div> )
}
