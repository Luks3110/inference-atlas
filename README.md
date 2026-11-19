# Inference Atlas

Curso interativo em português para quem desenvolve aplicações com modelos de IA. São 56 aulas em 13 módulos, com 455 etapas. Cada etapa tem uma explicação, um diagrama e um simulador com hipóteses explícitas. O site usa Svelte 5. O navegador guarda o progresso e a etapa atual.

## Abrir localmente

Com Node.js 22.12 ou superior e npm, execute na pasta do projeto.

```sh
npm ci
npm run dev
```

Abra [localhost na porta 5173](http://localhost:5173). Para escolher outra porta, use `npm run dev -- --port 5181`.

```sh
npm run build
```

O build gera o site estático em `dist/`, incluindo fontes e ilustrações. Sirva essa pasta por HTTP. Cada etapa tem um endereço com hash que pode ser compartilhado.

## Explorar

- **Aprender** começa pelo caminho de um pedido, pelas APIs de modelos e pelo harness que chama ferramentas. Depois, compara workflows e agentes, passa por RAG e ensina a avaliar e operar o sistema.
- **Produção** reúne os módulos de aplicações, avaliação e operação. Os casos indicam a fonte e o que foi medido ou simulado.
- **Prática** traz cinco decisões com explicação após a resposta.
- **Laboratório** compara versões de uma skill de devoluções. O exercício roda sem credenciais e permite baixar o SKILL.md, os casos e o avaliador.
- **Guias** têm exemplos copiáveis de Mastra, Temporal, A2A, Langfuse e testes de skills.

O aprofundamento opcional cobre os detalhes do modelo e da inferência, como KV cache, batching e MoE. O painel de progresso acompanha a trilha principal.

As setas esquerda e direita navegam pelas etapas. R restaura os parâmetros e reinicia o diagrama. Espaço pausa a animação. Ctrl/Cmd + K abre a busca.

## Simulações por etapa

As simulações numéricas têm parâmetros editáveis por slider ou teclado. Cada modelo expressa hipóteses e unidades. O diagrama e as métricas são recalculados no cliente. As curvas variam um parâmetro com os demais fixos. O navegador conserva o ajuste de cada etapa na sessão e o botão Restaurar recupera os valores iniciais. A topologia e as medições fixas do exemplo continuam disponíveis na própria etapa.

Nas nove etapas de HNSW, a opção **Busca HNSW · efSearch e filtro** executa a travessia do grafo em um Web Worker. O corpus contém 3.072 vetores sintéticos de 20 dimensões e 48 consultas. Após a busca, o worker aplica o filtro aos candidatos e compara os resultados com os dez vizinhos exatos elegíveis. O p95 é medido no aparelho do leitor. A medição pode ser fixada para comparar parâmetros. O benchmark Faiss de referência usa outro corpus, 16 mil vetores, 160 consultas e filtragem durante a busca. Os scripts permitem reproduzir ambos os ensaios.

```sh
uv run public/labs/build-hnsw-fixture.py
uv run public/labs/bench-hnsw-filter.py > resultado-filtro.json
```

## Índices vetoriais

As aulas de HNSW, quantização de embeddings e IVF incluem um benchmark em CPU com Faiss, 16 mil vetores, 160 consultas e gabarito exato Flat. Compare recall@10, p95, tamanho serializado e custo de reter os originais para reranking. Os resultados exibidos foram medidos no conjunto sintético descrito no script. Para repetir com as versões de Faiss e NumPy fixadas no próprio arquivo:

```sh
uv run public/labs/bench-indexes.py > resultado.json
```

## Testes de interface

```sh
npx playwright install chromium
npm run test:ui
```

A suíte usa o build estático. Ela percorre todas as etapas em viewport móvel e verifica navegação por hash, posição do menu lateral, persistência do progresso, busca, dimensionadores, quiz e cópia de comandos. Também valida a correspondência entre aula, lacuna e caso primário nos 13 módulos e os links entre relatório e aula. Para usar um Chromium já instalado, defina a variável `CHROMIUM_PATH` com o caminho do executável.

## Fontes

As aulas apontam para as fontes técnicas usadas. O material de avaliação humana usa a documentação de filas do Langfuse e discute como conferir desacordos antes de transformar uma anotação em caso de teste. [Filas de anotação do Langfuse](https://langfuse.com/docs/evaluation/evaluation-methods/annotation-queues)
