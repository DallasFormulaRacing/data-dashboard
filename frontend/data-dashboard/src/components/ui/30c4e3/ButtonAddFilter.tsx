import { Button } from "@/components/ui/button"

type Props = Readonly<{
    onClick?: () => void;
    title?: string;
}>;

export default function ButtonAddFilter({ onClick, title = "Add graph" }: Props) {
    return (
        <Button
            type="button"
            title={title}
            aria-label={title}
            variant="outline"
            className="h-[30px] rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 font-semibold text-xs px-3 shadow-xs flex items-center gap-1.5"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
                event.stopPropagation()
                onClick?.()
            }}
        >
            + Add Graph
        </Button>
    )
}