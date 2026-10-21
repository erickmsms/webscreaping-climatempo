/**
 * Estações meteorológicas do INMET em relação a cada cidade: quantas ficam dentro do município,
 * quantas no entorno e um índice de cobertura que junta as duas coisas. Só a localização entra na
 * conta; as medições das estações não são usadas.
 */

export type Estacao = {
  codigo: string;
  nome: string;
  uf: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  situacao: string;
  inicio: string | null;
};

/** Contorno de um município (GeoJSON, na ordem [longitude, latitude]). */
export type Geometria =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type Municipio = {
  cidade_id: string;
  nome: string;
  areaKm2: number;
  geometria: Geometria;
};

/** Até esta distância do limite do município (km), uma estação conta como "do entorno". */
export const RAIO_DO_ENTORNO_KM = 50;

const KM_POR_GRAU = 111.195;

/** Todos os anéis do contorno (o externo e os buracos de cada polígono). */
function aneis(geometria: Geometria): number[][][] {
  return geometria.type === "Polygon" ? geometria.coordinates : geometria.coordinates.flat(1);
}

/** Ponto dentro do contorno (regra par-ímpar; buracos do polígono contam como fora). */
export function pontoNoMunicipio(latitude: number, longitude: number, geometria: Geometria): boolean {
  let dentro = false;
  for (const anel of aneis(geometria)) {
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i, i += 1) {
      const [xi, yi] = anel[i];
      const [xj, yj] = anel[j];
      if (yi > latitude !== yj > latitude && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) {
        dentro = !dentro;
      }
    }
  }
  return dentro;
}

/** Distância (km) de um ponto ao contorno do município, na projeção plana local (boa para dezenas de km). */
export function distanciaAoContornoKm(latitude: number, longitude: number, geometria: Geometria): number {
  const escalaX = Math.cos((latitude * Math.PI) / 180) * KM_POR_GRAU;
  let menor = Number.POSITIVE_INFINITY;
  for (const anel of aneis(geometria)) {
    for (let i = 0; i < anel.length - 1; i += 1) {
      const ax = (anel[i][0] - longitude) * escalaX;
      const ay = (anel[i][1] - latitude) * KM_POR_GRAU;
      const bx = (anel[i + 1][0] - longitude) * escalaX;
      const by = (anel[i + 1][1] - latitude) * KM_POR_GRAU;
      const dx = bx - ax;
      const dy = by - ay;
      const tamanho = dx * dx + dy * dy;
      const t = tamanho === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / tamanho));
      menor = Math.min(menor, Math.hypot(ax + t * dx, ay + t * dy));
    }
  }
  return menor;
}

/** Raio (km) de um círculo com a mesma área do município: a "escala" da cidade. */
export function raioEquivalenteKm(areaKm2: number): number {
  return Math.sqrt(areaKm2 / Math.PI);
}

/**
 * Peso de uma estação na cobertura da cidade: 1 se está dentro; fora, cai com a distância ao limite
 * medida em raios da cidade (uma cidade pequena precisa de estação mais colada do que uma grande).
 */
export function pesoDaEstacao(dentro: boolean, kmDoLimite: number, raioKm: number): number {
  return dentro ? 1 : 1 / (1 + (kmDoLimite / raioKm) ** 2);
}

export type EstacaoPerto = { codigo: string; nome: string; kmDoLimite: number };

export type Categoria = "na cidade" | "só no entorno" | "descoberta";

export type CoberturaDaCidade = {
  cidade_id: string;
  areaKm2: number;
  /** Estações operantes dentro do município. */
  dentro: EstacaoPerto[];
  /** Estações operantes fora do município, até o raio do entorno, da mais perto para a mais longe. */
  noEntorno: EstacaoPerto[];
  /** Estações em pane (dentro ou no entorno), que não entram na conta. */
  emPane: number;
  /** Soma dos pesos das estações operantes: 1 equivale a uma estação dentro da cidade. */
  indice: number;
  categoria: Categoria;
};

export function coberturaDaCidade(municipio: Municipio, estacoes: Estacao[]): CoberturaDaCidade {
  const raio = raioEquivalenteKm(municipio.areaKm2);
  const medidas = estacoes.map((e) => {
    const dentro = pontoNoMunicipio(e.latitude, e.longitude, municipio.geometria);
    const kmDoLimite = dentro ? 0 : distanciaAoContornoKm(e.latitude, e.longitude, municipio.geometria);
    return { e, dentro, kmDoLimite };
  });
  const operantes = medidas.filter((m) => m.e.situacao === "Operante");
  const perto = (m: (typeof medidas)[number]): EstacaoPerto => ({
    codigo: m.e.codigo,
    nome: m.e.nome,
    kmDoLimite: m.kmDoLimite,
  });
  const dentro = operantes.filter((m) => m.dentro).map(perto);
  const noEntorno = operantes
    .filter((m) => !m.dentro && m.kmDoLimite <= RAIO_DO_ENTORNO_KM)
    .sort((a, b) => a.kmDoLimite - b.kmDoLimite)
    .map(perto);
  return {
    cidade_id: municipio.cidade_id,
    areaKm2: municipio.areaKm2,
    dentro,
    noEntorno,
    emPane: medidas.filter((m) => m.e.situacao !== "Operante" && (m.dentro || m.kmDoLimite <= RAIO_DO_ENTORNO_KM)).length,
    indice: operantes.reduce((soma, m) => soma + pesoDaEstacao(m.dentro, m.kmDoLimite, raio), 0),
    categoria: dentro.length > 0 ? "na cidade" : noEntorno.length > 0 ? "só no entorno" : "descoberta",
  };
}
