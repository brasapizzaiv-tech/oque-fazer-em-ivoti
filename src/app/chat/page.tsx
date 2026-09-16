import type { Metadata } from "next";
import Chat from "@/components/Chat";

export const metadata: Metadata = {
  title: "Pergunte ao Gui",
  description:
    "Converse com o Gui, o assistente do Guia de Ivoti: ele indica onde comer, passear e o que fazer agora, com base no que está aberto.",
};

export default function PaginaChat() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col">
      <Chat />
    </div>
  );
}
