import Link from "next/link";
import Calibration from "@/components/analysis/Calibration";
import DatasetEval from "@/components/analysis/DatasetEval";

export const metadata = { title: "Alt Ton Testi" };

export default function CalibrationPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <header className="mb-6 space-y-1">
        <Link href="/" className="text-xs text-stone-500 hover:text-stone-900">
          ← Deneme odasına dön
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Alt ton tahmini testi</h1>
      </header>
      <div className="space-y-10">
        <Calibration />
        <DatasetEval />
      </div>
    </main>
  );
}
