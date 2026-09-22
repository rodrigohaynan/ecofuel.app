# EcoFuel

Calculadora responsiva para comparar gasolina e etanol pelo **custo real por quilômetro**, sem exigir conta ou oferecer preços de postos não verificados.

## Funcionalidades desta atualização

- Calculadora que considera preço por litro e consumo real de cada combustível (km/L).
- Preço de equilíbrio do etanol: preço da gasolina × consumo com etanol ÷ consumo com gasolina.
- Economia estimada em 100 km, por viagem e por quilometragem mensal.
- Até 15 perfis de veículos e oito comparações no histórico local do navegador.
- Compartilhamento do resumo de cálculo usando recurso nativo do aparelho, área de transferência ou seleção manual.
- Layout responsivo com a logomarca original **logo.png**, sem qualquer edição da imagem.
- Compatibilidade com as chaves antigas de consumo salvas pelo site anterior.

## Executar e publicar

Projeto estático: abra \`index.html\` com um servidor HTTP local (por exemplo, \`python3 -m http.server 8000\`) e acesse \`http://localhost:8000\`. Para publicar, use uma hospedagem estática apontando para a raiz do repositório. Os arquivos \`index.html\`, \`styles.css\`, \`app.js\`, \`logo.png\` e \`politicadeprivacidade.html\` precisam estar disponíveis na mesma pasta.

Nenhuma chave de API, banco de dados, localização ou conta de usuário é necessária nesta versão. Perfis e histórico ficam no navegador e **não sincronizam** entre dispositivos. Os resultados são estimativas baseadas nos dados fornecidos pelo motorista, não cotações externas.

## Testes manuais sugeridos

1. Compare R$ 6/L e 12 km/L com R$ 4/L e 9 km/L: gasolina R$ 0,500/km, etanol ≈ R$ 0,444/km e equilíbrio do etanol R$ 4,50/L.
2. Troque para etanol a R$ 5/L: gasolina passa a ser mais econômica.
3. Informe mesmo custo/km para ambos, depois tente preço ou consumo zero: deve indicar equivalência e impedir divisão por zero, respectivamente.
4. Faça uma projeção de viagem e de quilometragem mensal e confira valores; limpe os campos.
5. Salve, recarregue e exclua um veículo; salve e reutilize uma comparação; teste o compartilhamento no Android e desktop.
6. Confira as páginas em 320 px, 375 px, 768 px e desktop, inclusive navegação por teclado.

## Próximas propostas (não implementadas)

- Busca de postos próximos e comparação de preços **somente com fonte de dados confiável, atualizada e identificação da data da coleta**, com autorização de localização.
- Relatórios de gastos por veículo e gráficos de consumo, se houver interesse do usuário em registrar abastecimentos.
- PWA instalável com experiência offline, ícones adaptativos e testes de atualização.
- Contas e sincronização entre dispositivos apenas se houver necessidade comprovada; exigiriam backend, autenticação e revisão da política de privacidade.
- Conciliação de métricas de impacto ambiental somente com metodologia e fatores de emissão documentados; o comparador atual otimiza custo financeiro, não mede emissões.
