'use client';

type Props = Readonly<{
    onClick?: () => void;
    title?: string;
}>;

export default function ButtonAddFilter({ onClick, title = "Add graph" }: Props) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-white pb-1 text-[30px] text-gray-600 transition-colors hover:bg-gray-200 active:bg-gray-300"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
                event.stopPropagation()
                onClick?.()
            }}
        >
            +
        </button>
    )
}