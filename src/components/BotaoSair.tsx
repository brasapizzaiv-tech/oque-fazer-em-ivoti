"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BotaoSair() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-full border border-mata-200 px-4 py-2 text-sm font-medium text-tinta/70 hover:bg-mata-50"
    >
      Sair
    </button>
  );
}
