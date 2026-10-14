# Mecfupi do Brasil — Site institucional

Site de página única da **Mecfupi do Brasil**, oficina especializada exclusivamente em **câmbio automático** (somente mão de obra / prestação de serviço), para todas as montadoras e linhas, no Imirim, São Paulo.

🔗 **Site no ar:** https://raphaelmondego.github.io/mecfupi-site/

## Dados da empresa

- **Endereço:** Rua Diogo Cabrera, 254 - Imirim, São Paulo - SP, CEP 02467-060
- **Telefone/WhatsApp:** (11) 99824-9580 — https://wa.me/5511998249580
- **Google Maps:** https://www.google.com/maps/search/Mecfupi+do+Brasil,+Rua+Diogo+Cabrera,+254,+Imirim,+São+Paulo,+SP

## Destaques

- **Abertura animada:** a alavanca passa por P → R → N → D, o conta-giros dispara e a tela se abre ao meio como a carcaça de um câmbio. Aparece uma vez por sessão (`?intro=1` força), tem botão "Pular" (ou Esc) e não roda com movimento reduzido.
- **Simulador de câmbio no hero:** alavanca P-R-N-D, conjunto planetário (solar, satélites, coroa) com cinemática real pela equação de Willis, conta-giros, velocímetro e trocas de marcha automáticas ao segurar o acelerador. Abre em modo demonstração e passa o controle ao visitante no primeiro toque. Bloqueia P/R com o carro andando, como um câmbio de verdade.
- **Raio-X do câmbio:** desenho técnico (blueprint) com 9 pontos clicáveis (conversor, bomba, embreagens, planetários, corpo de válvulas, solenoides, módulo TCM, trava P, óleo ATF), com função e sinais de defeito de cada um
- **Tipos de câmbio:** abas com animações de automático convencional, CVT (polias variáveis) e dupla embreagem (marchas pré-selecionadas)
- **Pré-diagnóstico online:** o visitante marca sintomas e informa o carro, recebe um nível de atenção e envia tudo pronto pelo WhatsApp
- **Mitos x verdades:** cards que viram com cuidados reais de uso do câmbio automático
- Indicador de marcha que acompanha o scroll, barra de progresso, partículas, glitch, glassmorphism, animações de entrada com IntersectionObserver
- HTML, CSS e JS puros, sem frameworks e sem build. Mobile-first, SEO, Open Graph, dados estruturados (`AutoRepair`), acessibilidade e `prefers-reduced-motion`

## Estrutura

```
mecfupi-site/
├── index.html
├── css/
│   └── style.css
├── img/
├── js/
│   └── main.js
└── README.md
```

## Rodar localmente

Abra o `index.html` no navegador, ou sirva a pasta:

```bash
python -m http.server 8000
# acesse http://localhost:8000
```

## Publicação (GitHub Pages)

1. No repositório no GitHub, vá em **Settings → Pages**
2. Em **Source**, escolha **Deploy from a branch**
3. Selecione a branch **main** e a pasta **/ (root)** e clique em **Save**
4. Em 1 a 2 minutos o site fica disponível em `https://<usuario>.github.io/mecfupi-site/`

## Personalização rápida

- **Horário de funcionamento:** `index.html` (seções Localização e Footer) e o bloco JSON-LD no `<head>`
- **Cores:** variáveis no topo de `css/style.css` (`--red`, `--bg`, `--metal`, `--white`)
- **Imagens:** pasta `img/` (fotos de câmbios automáticos do Wikimedia Commons; créditos no rodapé do site)
