"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const message = params.get("message") || "An unexpected error occurred.";

  return (
    <div className="max-w-lg mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg w-[500px] max-w-full text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="mb-4">{message}</p>
      </div>
      <button
        className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition border border-gray-300"
        onClick={() => router.back()}
      >
        Go Back
      </button>
    </div>
  );
}
