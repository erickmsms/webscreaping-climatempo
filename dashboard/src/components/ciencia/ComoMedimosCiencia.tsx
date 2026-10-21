/** O método e as limitações da aba, lado a lado, cada um com o seu título. */
export function ComoMedimosCiencia({ catalogoBaixadoEm }: { catalogoBaixadoEm: string | null }) {
  return (
    <div className="grid gap-8 rounded-xl bg-surface p-7 leading-relaxed md:grid-cols-2 md:gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Como medimos</h2>
        <p>
          O “óbvio” é supor que amanhã será igual a hoje: o erro dele é o quanto o tempo muda de um dia para o outro. O
          erro justo é o erro da previsão dividido por essa mudança, e a nota (0 a 100, maior é melhor) é 100 × (1 − erro justo). As relações usam correlação de Spearman, que mostra
          associação, não causa.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Limitações</h2>
        <p>
          O “real” segue sendo o registro do Climatempo, não a medição das estações. As estações entram só pela
          localização (catálogo do INMET{catalogoBaixadoEm ? `, baixado em ${catalogoBaixadoEm}` : ""}), medida a partir
          do centro do município. Com 4 cidades, as conclusões sobre estações são indicativas.
        </p>
      </section>
    </div>
  );
}
