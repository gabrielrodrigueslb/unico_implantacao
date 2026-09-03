# Perfis padrão de instância

Fonte de referência: `/home/gabriel/Downloads/Configs Instancia.zip`. Os
artefatos reutilizáveis foram importados para
`config/defaults/Configs Instancia/`, preservando a estrutura original. Os
artefatos foram analisados como dados de configuração, não como instruções.
Nenhuma configuração deste arquivo foi aplicada ao tenant de testes.

Não foram importados `*.configbackup`, o guia de integrações nem o arquivo de
links/acessos, pois podem conter dados sensíveis ou informações específicas de
uma instância.

## Pacotes disponíveis

| Perfil | Etiquetas de contato | Etiquetas de chat | Mensagens prontas | Uso recomendado |
| --- | ---: | ---: | --- | --- |
| `farma` | 25 | 14 | Documento ODT específico | Farmácia/drogaria |
| `matcon` | 9 | 14 | Documento ODT específico | Materiais de construção |
| `pet` | 23 | 11 | Documento ODT específico | Pet shop, clínica ou veterinária |
| `generico` | — | — | Arquivo de mensagens operacionais | Ponto de partida para qualquer segmento |

Os perfis de Farma e Matcon compartilham a mesma taxonomia operacional de
etiquetas de chat (pagamento, retorno, transferência, atenção, orçamento e
outros). O perfil Pet acrescenta etiquetas de espécie, porte, pelagem e
serviços veterinários. As etiquetas de contato de cada perfil representam o
vocabulário do segmento, portanto não devem ser mescladas automaticamente.

## URAs reutilizáveis

| Artefato | Nome interno | Nós | Tipos de nó | Propósito |
| --- | --- | ---: | --- | --- |
| `1 - Boas Vindas Basico.ivr` | Boas Vindas | 6 | `0, 3, 5, 8` | Saudação e encaminhamento por horário. |
| `2 - Boas Vindas - URA avançada.ivr` | Boas Vindas | 12 | `0, 3, 4, 5, 8, 11, 21` | Fluxo com condições e JavaScript. |
| `3 - Boas Vindas Avançada - Cadastro.ivr` | Boas Vindas | 15 | `0, 3, 4, 5, 8, 11, 14, 15, 21` | Fluxo avançado com coleta/cadastro. |
| `4 - URA Rede Social.ivr` | URA Rede Social | 6 | `3, 4, 5, 11` | Triagem para canais sociais. |

Os arquivos `.ivr` são Base64 de JSON. Após decodificação, trazem o objeto
completo da URA — incluindo `name`, `type`, `initialtext`, `options`,
`finishtext`, `timeout`, `buttons` e as coordenadas dos nós. Antes de criar,
o executor deve substituir IDs de destino (filas/URA) pelo ID resolvido no
tenant e renomear a URA para evitar colisão com outras “Boas Vindas”.

## Mensagens operacionais genéricas

O pacote contém modelos para os seguintes pontos de configuração:

- motivos de encerramento;
- mensagem fora do horário;
- tratamento de chamada de voz/vídeo no WhatsApp;
- encerramento automático por inatividade;
- encerramento manual;
- pesquisa de qualidade e agradecimento;
- saudação, consulta de estoque e forma de pagamento.

Os textos possuem placeholders de operação, como horários e nome da empresa.
O perfil deve exigir a substituição desses valores na etapa de revisão; nunca
enviar `#`, `NOME DA EMPRESA` ou outro placeholder sem confirmação.

## Contrato interno do seletor de perfil

```text
perfil escolhido
  -> carregar inventário local do perfil
  -> operador seleciona itens e informa variáveis obrigatórias
  -> resolver/criar filas e URAs dependentes
  -> aplicar recursos cuja rota de escrita esteja confirmada
  -> reler e comparar resultado
  -> registrar itens pendentes no relatório da implantação
```

As etiquetas e mensagens pré-definidas permanecem preparadas, mas bloqueadas
no executor até que seus endpoints administrativos de escrita sejam capturados
e documentados. A seleção de um perfil nunca deve sobrescrever um recurso já
existente: a chave de conciliação é o nome normalizado e a ação padrão diante
de divergência é solicitar decisão do operador.

## Pendências de normalização

- Converter o conteúdo dos documentos ODT de mensagens prontas em registros
  estruturados (`title`, `text`, grupos e botões), mantendo os originais como
  referência.
- Definir, por perfil, quais etiquetas são obrigatórias, sugeridas ou opt-in.
- Associar destinos das URAs às filas escolhidas durante cada implantação.
- Somente depois da captura das rotas de escrita, materializar os JSONs de
  importação e habilitar a criação automática de etiquetas e mensagens.
