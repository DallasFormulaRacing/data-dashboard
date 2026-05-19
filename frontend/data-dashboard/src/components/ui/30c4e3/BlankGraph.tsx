import ButtonAddFilter from "./ButtonAddFilter"
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon"
import TrashIcon from "@heroicons/react/24/outline/TrashIcon"
import { GripHorizontal } from "lucide-react"
import { memo } from "react"
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
    onAddGraph?: () => void
    onEdit?: () => void
    onDelete?: () => void
}

function BlankGraphComponent({
    id,
    x,
    y,
    w,
    h = 1,
    minW = 1,
    maxW = 2,
    minH = 1,
    maxH,
    onAddGraph,
    onEdit,
    onDelete,
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
                <div className="relative h-full w-full overflow-hidden rounded-lg border border-white/10 bg-black text-white">
                    <div className="absolute right-3 top-3 z-20 flex gap-2">
                        <button
                            type="button"
                            title="Edit graph"
                            aria-label="Edit graph"
                            className="rounded-full border border-white/15 bg-black/70 p-2 text-white transition-colors hover:bg-sky-500/20 hover:text-sky-200"
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                                event.stopPropagation()
                                onEdit?.()
                            }}
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            title="Delete graph"
                            aria-label="Delete graph"
                            className="rounded-full border border-white/15 bg-black/70 p-2 text-white transition-colors hover:bg-red-500/20 hover:text-red-300"
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                                event.stopPropagation()
                                onDelete?.()
                            }}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="drag-handle flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing">
                        <div className="flex items-center">
                            <GripHorizontal className="mr-2 h-5 w-5 text-white/30 shrink-0" />
                            <h2 className="text-lg font-semibold">Blank Graph</h2>
                        </div>
                        <ButtonAddFilter onClick={onAddGraph} />
                    </div>
                    <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
                        <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-white/30 bg-white/5">
                            <h1 className="text-lg italic text-white/70">Insert Graph Here</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(BlankGraphComponent)
