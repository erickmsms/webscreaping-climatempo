import { Aviso } from "@/components/Aviso";
import { Dashboard } from "@/components/Dashboard";
import { carregarComparacao } from "@/lib/dados";

export default async function Page() {
  const resultado = await carregarComparacao();

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-bold sm:text-4xl">🌦️ Qualidade da Previsão - Climatempo</h1>
      {resultado.status === "sem-banco" && <Aviso tipo="erro">Não encontrei dataset_climatempo.db.</Aviso>}
      {resultado.status === "sem-pares" && (
        <Aviso tipo="alerta">Não encontrei pares válidos de previsão D-1 → real D.</Aviso>
      )}
      {resultado.status === "ok" && <Dashboard linhas={resultado.linhas} />}
    </main>
  );
}
