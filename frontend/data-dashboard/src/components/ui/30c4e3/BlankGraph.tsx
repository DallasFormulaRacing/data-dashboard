import ButtonAddFilter from "./ButtonAddFilter"
 

export default function BlankGraph() { 
    return ( 
    <div className="h-full flex flex-col gap-2 overflow-hidden">
        <ButtonAddFilter />
        <div className="bg-white rounded-lg flex-1 min-h-0 w-full border-2 border-gray-400 flex items-center justify-center overflow-hidden">
            <h1 className="text-xl text-gray-500 italic">Insert Graph Here</h1>
        </div>
    </div> )
}
