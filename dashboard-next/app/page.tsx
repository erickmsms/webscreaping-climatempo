import { Aviso } from "@/components/Aviso";
import { Cabecalho } from "@/components/Cabecalho";
import { Dashboard } from "@/components/Dashboard";
import { carregarComparacao } from "@/lib/dados";

export default async function Page() {
  const resultado = await carregarComparacao();
  if (resultado.status === "ok") return <Dashboard linhas={resultado.linhas} />;

  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-[70rem] px-6 py-14">
        {resultado.status === "sem-banco" ? (
          <Aviso tipo="erro">Não encontrei o banco de dados (dataset_climatempo.db).</Aviso>
        ) : (
          <Aviso tipo="alerta">Não encontrei pares válidos de previsão D-1 → real D.</Aviso>
        )}
      </main>
    </>
  );
}
