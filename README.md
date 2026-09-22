# EcoFuel

Comparador responsivo de gasolina e etanol pelo custo por quilômetro, com painel local de abastecimentos, sem exigir cadastro.

## Funcionalidades

- Calculadora de custo/km com preços e consumo real; preço de equilíbrio do etanol e projeção de economia por 100 km, viagem e mês.
- Até 15 veículos e oito comparações salvas no navegador; compartilhamento de resultados.
- Painel (painel.html): até 300 registros de abastecimentos com veículo, data, combustível, litros, preço, odômetro opcional e posto.
- Visão geral de gastos, litros e preço médio ponderado; filtros por mês e veículo, histórico e gráfico de até seis meses com registros.
- Até 100 postos favoritos com preços anotados manualmente, cidade e data da observação; opção de aproveitar esses preços na calculadora.
- Busca externa de postos no Google Maps por cidade/bairro ou localização com permissão solicitada por ação do usuário.
- Backup e restauração JSON de veículos, comparações, abastecimentos e postos. A restauração substitui os dados locais.
- Interface responsiva preservando logo.png integralmente. Dados antigos de consumo são reaproveitados.

**Os preços dos postos são informados pelo usuário e não são cotações em tempo real.** A ferramenta não mede emissões nem o consumo real com base em abastecimentos parciais.

## Executar e publicar

Projeto estático. Abra um servidor HTTP local a partir da raiz do repositório, por exemplo com o comando python3 -m http.server 8000, e acesse http://localhost:8000. Publique todos os arquivos na mesma pasta:

- index.html, styles.css, app.js, painel.html, painel.css, painel.js, logo.png e politicadeprivacidade.html.

Sem necessidade de backend, conta de usuário ou chave de API. Perfis, comparações, abastecimentos e postos ficam no navegador, sem sincronização automática. O arquivo JSON de backup deve ser guardado pelo usuário.

## Testes manuais antes de publicar

1. Compare gasolina R$ 6/L, 12 km/L, com etanol R$ 4/L, 9 km/L. Equilíbrio do etanol: R$ 4,50/L; etanol custa menos por km. Com etanol a R$ 5/L, gasolina custa menos.
2. Registre 10 L a R$ 6/L e 20 L a R$ 5/L no mesmo veículo. Resumo: R$ 160,00, 30 L e preço médio ponderado ≈ R$ 5,33/L.
3. Filtre abastecimentos por mês/veículo e exclua um registro. Confira o recálculo do resumo, histórico e gráfico.
4. Salve um posto com dois preços e clique em 'Comparar estes preços'; a calculadora deve receber os valores e mostrar a data de anotação.
5. Exporte um backup, adicione dados e restaure o arquivo. Confira se o conjunto anterior foi restaurado. Rejeite JSON inválido.
6. Teste geolocalização concedida/negada, alternativa de busca por cidade e navegação em Android, iOS e desktop.
7. Teste dimensões de 320 px, 375 px, 768 px e desktop, teclado e comunicação de erros.

## Evoluções posteriores (não implementadas)

- Fonte verificável de preços reais por posto, com data de coleta, autorização e tratamento de preços desatualizados.
- Consumo medido (km/L) por ciclo de tanque cheio, com dados suficientes para estimativas confiáveis.
- PWA instalável/offline, caso haja necessidade de uso sem internet.
- Sincronização opcional entre dispositivos com backend, autenticação, política de privacidade e proteção de dados.
- Métricas ambientais somente com metodologia e fatores de emissão transparentes.