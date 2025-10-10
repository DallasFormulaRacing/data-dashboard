// src/app/page.tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Shadcn + Tailwind works!</h1>
        <Button>Click Me</Button>
      </div>
    </main>
  )
}