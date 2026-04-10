import Image from "next/image"
import logo from "../../components/images/dfr-logo-tyre.png"

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
            <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl shadow-black/40 sm:p-10">
                <div className="flex items-center justify-center">
                    <div className="rounded-2xl px-4 py-3">
                        <Image src={logo} alt="Dallas Formula Racing" className="h-12 w-auto" priority />
                    </div>
                </div>

                {/*
                  Earlier version idea kept here for reference:
                  - split hero / form layout
                  - feature cards and helper copy
                  - secondary footer note
                */}

                <form className="mt-8 space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="discord" className="sr-only">
                            Discord login
                        </label>
                    <button
                        type="submit"
                        className="w-full rounded-2xl bg-[#8442f5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#124734] focus:outline-none focus:ring-4 focus:ring-[#e87500]/20"
                    >
                        Sign in with Discord
                    </button>
                    </div>
                </form>
            </section>
        </main>
    )

}