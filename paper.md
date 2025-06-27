# A flexible, modular, integrated microgrid monitoring environment for the IoT-Era.

- Flask Web backend
- Fast, lightweight, Vanilla JS Web frontend
    - GridStack
- pymodbus
    - Custom data format support
- easy-to-set-up YAML configuration

- MongoDB database
- Dockerized, nginx, HTTP/3
- Fully open-source
- Modern web-based, containerized, lightweight stack:
    - SCADA alternatives are either proprietary (give examples) or based on legacy stacks (scadaBR, SCADA-LTS, which uses Java).
    - SCADA alternatives, by having much more complex functionality, end up having much Larger footprint
    - Our implementation is build from the ground up to be ready for the modern Web: HTTP/3 QUIC, TLS 1.3, 
    IPv6 ready, which makes it more adequate for IoT Modbus TCP devices which may need IPv6 connectivity 
    now or (even more so) in the future.



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

