# A flexible, modular, integrated microgrid monitoring environment for the IoT-Era.

- Flask Web backend
- Fast, lightweight, Vanilla JS Web frontend
    - GridStack
- pymodbus
    - Custom data format support
- easy-to-set-up YAML configuration

- MongoDB database
- Dockerized, nginx, HTTP/3


Autodetect from mongoDB data:

For each device:

- Visão geral (apenas valores não-aninhados)
- Visão completa (inclui dados aninhados)
- [métrica] por fase (tensão, corrente, potência, reativa, aparente, FP, THD V, THD A)
- Visão da fase (dados de uma das fases para todos os dados aninhados)

Alterar cor do card conforme dispositivo na criação dos cards.
Simplificar lógica de valores médios, etc. (usar dados fornecidos diretamente em vez de calcular)
Usar devices.yaml para gerar a lista de cards?
    obter friendly_name, unit e abbr de devices.yaml em vez de hardcode no JS.

Necessário descrever em detalhes configuração YAML e suas vantagens: fácil definição de layout (arrays para 3-phase data), nomes intuitivos/traduzidos, siglas e letras de unidade