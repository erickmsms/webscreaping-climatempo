import { Aviso } from "@/components/ui/Aviso";
import { Cabecalho } from "@/components/boletim/Cabecalho";
import { Boletim } from "@/components/boletim/Boletim";
import { carregarComparacao } from "@/lib/dados/carregar";

export default async function Page() {
  const resultado = await carregarComparacao();
  if (resultado.status === "ok") return <Boletim linhas={resultado.linhas} />;

  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-[70rem] px-6 py-14">
        {resultado.status === "sem-dados" ? (
          <Aviso tipo="erro">Não encontrei os dados da coleta (data/bronze/previsoes.jsonl).</Aviso>
        ) : (
          <Aviso tipo="alerta">Não encontrei pares válidos de previsão D-1 → real D.</Aviso>
        )}
      </main>
    </>
  );
}
