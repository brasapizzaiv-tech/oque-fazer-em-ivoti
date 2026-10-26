import type { Metadata } from "next";
import ChatDoGuia from "@/components/vidro/ChatDoGuia";
import { enderecoOficial } from "@/lib/site";

export const metadata: Metadata = {
  alternates: enderecoOficial("/chat"),
  title: "O Guia",
  description:
    "Converse com o Guia: onde comer, o que visitar e um roteiro pronto para você em Ivoti.",
};

export default function Chat() {
  return <ChatDoGuia />;
}
