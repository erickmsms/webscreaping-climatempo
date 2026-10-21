/** O método e a limitação do dado, lado a lado, cada um com o seu título. */
export function ComoMedimos() {
  return (
    <div className="grid gap-8 rounded-xl bg-surface p-7 leading-relaxed md:grid-cols-2 md:gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Como medimos</h2>
        <p>
          Para cada cidade e dia, pegamos a previsão publicada na véspera (D-1) e comparamos com o registro do
          próprio Climatempo no dia (D).
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Limitação</h2>
        <p>
          O “real” ainda é o registro do site, não uma medição de estação. Próxima etapa: comparar com as estações
          do INMET.
        </p>
      </section>
    </div>
  );
}
