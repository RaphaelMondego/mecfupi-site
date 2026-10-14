# Mecfupi do Brasil — Site institucional

Site de página única da **Mecfupi do Brasil**, loja de peças e acessórios novos para veículos automotores no Imirim, São Paulo.

🔗 **Site no ar:** https://raphaelmondego.github.io/mecfupi-site/

## Dados da empresa

- **Endereço:** Rua Diogo Cabrera, 254 - Imirim, São Paulo - SP, CEP 02467-060
- **Telefone/WhatsApp:** (11) 99824-9580 — https://wa.me/5511998249580
- **Google Maps:** https://www.google.com/maps/search/Mecfupi+do+Brasil,+Rua+Diogo+Cabrera,+254,+Imirim,+São+Paulo,+SP

## Tecnologia

HTML, CSS e JavaScript puros: sem frameworks, sem build, sem dependências.

- Engrenagens 3D interligadas no hero feitas só com CSS (`transform-style: preserve-3d` + `@keyframes`), com velocidades proporcionais ao número de dentes para o engrenamento ficar realista
- Partículas (faíscas) em `<canvas>` e efeito glitch sutil no título
- Barra de progresso de scroll no topo
- Animações de entrada com `IntersectionObserver` (fade-in, slide-up, slide-left, slide-right)
- Navbar fixa que ganha fundo com blur ao rolar, menu hambúrguer no mobile
- Botão "voltar ao topo" e botão flutuante de WhatsApp
- Glassmorphism, gradientes e efeitos de hover
- Mobile-first, `loading="lazy"` nas imagens, SEO, Open Graph e dados estruturados (Schema.org `AutoPartsStore`)
- Respeita `prefers-reduced-motion`

## Estrutura

```
mecfupi-site/
├── index.html
├── css/
│   └── style.css
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
- **Imagens:** URLs do Unsplash em `index.html` e no fundo do hero em `css/style.css` (`.hero-bg`)
