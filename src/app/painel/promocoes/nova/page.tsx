import Link from "next/link";
import FormularioPromocao from "@/components/painel/FormularioPromocao";
import { locaisParaEvento } from "../../eventos/locais-do-dono";

export const dynamic = "force-dynamic";

export default async function NovaPromocao() {
  const { locais } = await locaisParaEvento();

  return (
    <>
      <Link href="/painel/promocoes" className="text-sm texto-suave">
        ← Minhas promoções
      </Link>
      <div className="mt-2 mb-6">
        <h1
          className="text-[22px] font-bold sm:text-[26px]"
          style={{
            color: "var(--color-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Cadastrar promoção
        </h1>
      </div>

      {locais.length === 0 ? (
        <p className="caixa-painel border-dashed p-8 text-center text-sm texto-suave">
          Cadastre primeiro o seu estabelecimento — a promoção fica ligada a
          ele.
        </p>
      ) : (
        <FormularioPromocao locais={locais} />
      )}
    </>
  );
}
