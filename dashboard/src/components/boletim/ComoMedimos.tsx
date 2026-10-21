/** O método e a limitação do dado, em duas colunas na largura toda. As definições dos termos ficam nos tooltips. */
export function ComoMedimos() {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface p-7 leading-relaxed">
      <h2 className="font-display text-xl font-bold">Como medimos</h2>
      <div className="grid gap-4 md:grid-cols-2 md:gap-10">
        <p>
          Para cada cidade e dia, pegamos a previsão publicada na véspera (D-1) e comparamos com o registro do
          próprio Climatempo no dia (D).
        </p>
        <p>
          <strong>Limitação:</strong> o “real” ainda é o registro do site, não uma medição de estação. Próxima
          etapa: comparar com as estações do INMET.
        </p>
      </div>
    </section>
  );
}
