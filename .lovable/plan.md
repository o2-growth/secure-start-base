

## Ajuste de Identidade Visual — Plano

### Cores da marca (da imagem enviada)
- **Vivid Green**: `#6CF269` → HSL `119 82% 68%`
- **Intense Gray**: `#494949` → HSL `0 0% 29%`

### Mudanças

Atualizar `src/index.css` substituindo as cores teal/green atuais (HSL 168°) pelas cores da marca O2:

**Light mode:**
- `--primary`: `119 82% 42%` (green mais saturado para contraste em fundo claro)
- `--ring`: usar primary
- `--accent`: `119 40% 92%` (green bem claro para backgrounds)
- `--accent-foreground`: `119 60% 22%`
- `--sidebar-background`: `0 0% 14%` (gray escuro baseado no intense gray)
- `--sidebar-primary`: `119 82% 55%` (green vibrante no sidebar escuro)
- `--sidebar-ring`: mesmo que sidebar-primary
- `--success`: manter green separado ou alinhar

**Dark mode:**
- `--primary`: `119 82% 55%` (green mais claro para legibilidade)
- `--accent-foreground`: `119 60% 55%`
- `--sidebar-primary`: `119 82% 60%`
- `--sidebar-ring`: mesmo

**Phase colors:**
- `--phase-meeting`: atualizar de teal para green da marca

### Arquivo modificado
- `src/index.css` — substituir todas as referências HSL 168° pela paleta O2

