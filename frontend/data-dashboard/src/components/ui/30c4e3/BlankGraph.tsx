import ButtonAddFilter from "./ButtonAddFilter"
import TrashIcon from "@heroicons/react/24/outline/TrashIcon"
type GraphProps = {
    id: string
    x: number
    y: number
    w: number
    h?: number
    minW?: number
    maxW?: number
    minH?: number
    maxH?: number
}

export default function BlankGraph({
    id,
    x,
    y,
    w,
    h = 1,
    minW = 1,
    maxW = 2,
    minH = 1,
    maxH = 1,
}: GraphProps) {
    return (
        <div
            className="grid-stack-item"
            gs-id={id}
            gs-x={x}
            gs-y={y}
            gs-w={w}
            gs-h={h}
            gs-min-w={minW}
            gs-max-w={maxW}
            gs-min-h={minH}
            gs-max-h={maxH}
        >
            <div className="grid-stack-item-content">
                <div className="h-full flex flex-col gap-2 overflow-hidden">
                    <div className="inline-block drag-handle cursor-grab">
                        <ButtonAddFilter />
                        <TrashIcon className="w-6 h-6 text-black hover:text-red-500" />
                    </div>
                    <div className="bg-white rounded-lg flex-1 min-h-0 w-full border-2 border-gray-400 flex items-center justify-center overflow-hidden">
                        <h1 className="text-xl text-gray-500 italic">Insert Graph Here</h1>
                    </div>
        </div>
            </div>
        </div>
    )
}
