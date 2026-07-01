export const capitalStates = {
  "Aracajú": "SE",
  "Belém": "PA",
  "Belo Horizonte": "MG",
  "Boa Vista": "RR",
  "Brasília": "DF",
  "Campo Grande": "MS",
  "Cuiabá": "MT",
  "Curitiba": "PR",
  "Florianópolis": "SC",
  "Fortaleza": "CE",
  "Goiânia": "GO",
  "João Pessoa": "PB",
  "Macapá": "AP",
  "Maceió": "AL",
  "Manaus": "AM",
  "Natal": "RN",
  "Palmas": "TO",
  "Porto Alegre": "RS",
  "Porto Velho": "RO",
  "Recife": "PE",
  "Rio Branco": "AC",
  "Rio de Janeiro": "RJ",
  "Salvador": "BA",
  "São Luis": "MA",
  "São Paulo": "SP",
  "Teresina": "PI",
  "Vitória": "ES"
};

export function getGmapsSearchQuery(name) {
  const state = capitalStates[name];
  return state ? `${name} - ${state}, Brasil` : `${name}, Brasil`;
}
