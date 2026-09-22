"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DIAS, hhmm } from "@/lib/horarios";
import { Bloco, BotaoSalvar } from "./Campos";
import type { Horario } from "@/lib/tipos";

type Faixa = { abre: string; fecha: string };

export default function EditorHorarios({
  localId,
  horarios,
}: {
  localId: string;
  horarios: Horario[];
}) {
  // Um vetor de faixas por dia da semana (0 = domingo).
  const [semana, setSemana] = useState<Faixa[][]>(() =>
    DIAS.map((_, dia) =>
      horarios
        .filter((h) => h.dia_semana === dia)
        .map((h) => ({ abre: hhmm(h.abre), fecha: hhmm(h.fecha) })),
    ),
  );
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function mexer(dia: number, mudar: (faixas: Faixa[]) => Faixa[]) {
    setSemana((atual) =>
      atual.map((faixas, i) => (i === dia ? mudar(faixas) : faixas)),
    );
    setSalvo(false);
  }

  /** Copia o que está na segunda-feira pra terça a sexta. */
  function repetirNaSemana() {
    const segunda = semana[1];
    setSemana((atual) =>
      atual.map((faixas, dia) =>
        dia >= 2 && dia <= 5 ? segunda.map((f) => ({ ...f })) : faixas,
      ),
    );
    setSalvo(false);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const linhas = semana.flatMap((faixas, dia) =>
      faixas
        .filter((f) => f.abre && f.fecha)
        .map((f) => ({
          local_id: localId,
          dia_semana: dia,
          abre: f.abre,
          fecha: f.fecha,
        })),
    );

    const supabase = createClient();
    // Substitui tudo: é mais simples (e mais previsível) do que casar linha
    // a linha o que mudou.
    const { error: erroApagar } = await supabase
      .from("locais_horarios")
      .delete()
      .eq("local_id", localId);

    if (!erroApagar && linhas.length > 0) {
      const { error } = await supabase.from("locais_horarios").insert(linhas);
      if (error) setErro(error.message);
    } else if (erroApagar) {
      setErro(erroApagar.message);
    }

    setSalvando(false);
    setSalvo(true);
    // Pede ao painel que recalcule o que ainda falta. Sem isto o aviso
    // "Ainda precisa de: os horários" continuava na tela depois de salvar os
    // horários — o dado ia para o banco, mas a lista e montada no servidor e
    // ficava velha. O comerciante lia que nao salvou e tentava de novo.
    router.refresh();
  }

  return (
    <form onSubmit={salvar}>
      <Bloco
        titulo="Horários"
        descricao="É com isso que o site mostra “aberto agora” e o guia sabe para onde mandar as pessoas. Deixe o dia em branco quando estiver fechado."
      >
        <div className="space-y-2">
          {DIAS.map((nome, dia) => (
            <div
              key={dia}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--color-v-texto)]/20 p-2"
            >
              <span className="w-20 shrink-0 text-sm font-medium">{nome}</span>

              {semana[dia].length === 0 ? (
                <span className="text-sm texto-suave">Fechado</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {semana[dia].map((faixa, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 border border-[color:var(--color-v-texto)]/20 px-2 py-1"
                    >
                      <input
                        type="time"
                        value={faixa.abre}
                        onChange={(e) =>
                          mexer(dia, (f) =>
                            f.map((x, j) =>
                              j === i ? { ...x, abre: e.target.value } : x,
                            ),
                          )
                        }
                        className="rounded border-0 bg-transparent text-sm"
                      />
                      <span className="texto-suave">até</span>
                      <input
                        type="time"
                        value={faixa.fecha}
                        onChange={(e) =>
                          mexer(dia, (f) =>
                            f.map((x, j) =>
                              j === i ? { ...x, fecha: e.target.value } : x,
                            ),
                          )
                        }
                        className="rounded border-0 bg-transparent text-sm"
                      />
                      <button
                        type="button"
                        aria-label="Remover faixa"
                        onClick={() =>
                          mexer(dia, (f) => f.filter((_, j) => j !== i))
                        }
                        className="ml-1 texto-suave hover:text-[color:var(--color-v-fechado-claro)]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  mexer(dia, (f) => [
                    ...f,
                    f.length === 0
                      ? { abre: "09:00", fecha: "18:00" }
                      : { abre: "18:00", fecha: "23:00" },
                  ])
                }
                className="ml-auto botao-vazado px-2.5 py-1.5 text-[12px]"
              >
                + horário
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={repetirNaSemana}
          className="text-[14px] font-semibold text-[color:var(--color-v-torii)] underline"
        >
          Repetir a segunda de terça a sexta
        </button>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]">
            {erro}
          </p>
        )}

        <BotaoSalvar salvando={salvando} salvo={salvo}>
          Salvar horários
        </BotaoSalvar>
      </Bloco>
    </form>
  );
}
