import Link from "next/link";
import BotaoSair from "@/components/BotaoSair";
import FundoDaCidade from "@/components/vidro/FundoDaCidade";
import { Logo } from "@/components/vidro/pecas";
import AbasAdmin from "@/components/painel/AbasAdmin";

/**
 * A casca da administração.
 *
 * Mesma barra do painel, com a tarja da petúnia para não haver dúvida sobre
 * onde a pessoa está: daqui se aprova cadastro e se muda plano dos outros, e
 * confundir esta tela com o painel do próprio estabelecimento é o tipo de
 * engano que acaba em cadastro alheio editado por acidente.
 */
export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen">
      <FundoDaCidade />

      <header>
        <div
          style={{
            backgroundColor: "rgba(43, 35, 32, 0.9)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
            <Link href="/" className="shrink-0">
              <Logo sobreFoto />
            </Link>

            <span
              className="rounded-[4px] px-2 py-1 text-[10px] font-bold tracking-[0.12em] uppercase"
              style={{
                backgroundColor: "var(--color-v-petunia)",
                color: "#FFFFFF",
              }}
            >
              Administração
            </span>

            <span className="ml-auto flex items-center gap-2">
              <Link
                href="/painel"
                className="rounded-[9px] px-3.5 py-2 text-[13px] font-semibold"
                style={{
                  border: "2px solid rgba(255,255,255,0.85)",
                  color: "#FFFFFF",
                }}
              >
                Meu painel
              </Link>
              <BotaoSair claro />
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-5 pb-10">
        <AbasAdmin />
        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}
