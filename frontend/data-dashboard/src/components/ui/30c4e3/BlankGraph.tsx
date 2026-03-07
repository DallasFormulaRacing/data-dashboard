import ButtonAddFilter from "./ButtonAddFilter"
 

export default function BlankGraph() { 
    return ( 
    <div className="grid-stack-item py-4" gs-id="blank-graph-1" gs-x="0" gs-y="0" gs-w="1" gs-h="1" gs-min-w="1" gs-max-w="2" gs-min-h="1" gs-max-h="1">
        <div className="grid-stack-item-content"></div>
            <div className="h-full flex flex-col gap-2 overflow-hidden">
                <ButtonAddFilter />
                <div className="bg-white rounded-lg flex-1 min-h-0 w-full border-2 border-gray-400 flex items-center justify-center overflow-hidden">
                    <h1 className="text-xl text-gray-500 italic">Insert Graph Here</h1>
                </div>
        </div>
    </div>
    )
}
