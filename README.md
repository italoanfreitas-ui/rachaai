# Racha Aí 💰

**WebAplicativo 100% Standalone** de divisão de despesas em grupo - Um único arquivo HTML!

## ✨ Características Principais

- ✅ **100% Standalone** - Apenas um arquivo `index.html` (CSS e JS inline)
- ✅ **Sem dependências externas** - Funciona offline, sem internet
- ✅ **Design moderno** - Interface com gradientes e visual elegante
- ✅ **Totalmente responsivo** - Mobile, tablet e desktop
- ✅ **Cálculos precisos** - Algoritmos de liquidação otimizados
- ✅ **Persistência local** - Dados salvos no navegador
- ✅ **Import/Export JSON** - Portabilidade total dos dados
- ✅ **Geração de PDF** - Relatórios visuais e profissionais

## 🎯 Funcionalidades

### Gerenciamento de Grupos
- Criar, editar e excluir grupos de despesas
- Configurar modo de liquidação (reduzido ou direto)
- Visualizar estatísticas por grupo

### Gestão de Membros
- Adicionar e editar membros do grupo
- Validação de exclusão (membros em uso são protegidos)

### Controle de Despesas
- Lançar despesas com descrição e valor
- Indicar quem pagou e quem participou
- **Data e hora** de cada despesa
- **Três modos de divisão**:
  - **Igualitária**: Valor dividido igualmente
  - **Por Partes**: Pesos/frações personalizados (ex: 0.5, 1, 2)
  - **Por Valor**: Valores fixos por pessoa
- **Filtros avançados**: Busca por descrição e intervalo de datas

### Cálculo de Saldos
- Total pago por membro
- Total devido por membro
- Saldo final (crédito/débito/quitado)
- Indicadores visuais com cores

### Liquidação Inteligente

#### Modo Não Reduzido
Mantém relações diretas de débito. Cada pessoa paga diretamente para quem pagou a despesa.

#### Modo Reduzido (Otimizado)
Algoritmo de compensação que:
- Minimiza o número de transferências
- Permite pagamentos indiretos
- Ordena credores e devedores por valor

### Persistência e Portabilidade
- Salvamento automático no localStorage
- Exportação de grupo para JSON
- Importação de JSON com validação
- Restauração completa de dados

### Relatório em PDF
Gera PDF profissional usando `window.print()` com:
- Design visual atraente
- Cabeçalho com gradiente
- Estatísticas do grupo
- Lista detalhada de despesas
- Resumo de saldos colorido
- Instruções de liquidação formatadas

## 🚀 Como Usar

### 1. Abrir o Aplicativo
Basta abrir o arquivo `index.html` em qualquer navegador moderno. Não precisa de servidor ou internet!

### 2. Criar um Grupo
1. Clique em "Novo Grupo"
2. Digite o nome (ex: "Viagem Praia 2026")
3. Escolha se quer redução de transações
4. Salve

### 3. Adicionar Membros
1. Selecione o grupo no cabeçalho
2. Vá em "Membros"
3. Adicione cada participante

### 4. Lançar Despesas
1. Vá em "Despesas"
2. Clique em "Nova Despesa"
3. Preencha:
   - Descrição
   - Valor total
   - Data e hora
   - Quem pagou
   - Modo de divisão
   - Participantes (e valores/partes conforme o modo)
4. Salve

### 5. Ver Saldos
Acesse "Resumo" para ver quanto cada pessoa deve pagar ou receber.

### 6. Ver Liquidação
Em "Liquidação", veja as instruções exatas de quem paga para quem e quanto.

### 7. Exportar/Importar
- **Exportar**: Baixe o JSON do grupo
- **Importar**: Carregue o JSON em outro dispositivo

### 8. Gerar PDF
1. Clique em "Gerar PDF"
2. Janela de impressão abre automaticamente
3. Escolha "Salvar como PDF"
4. Baixe o relatório

## 💡 Exemplo de Uso

### Cenário: Viagem de 3 Amigos

**Grupo**: Viagem Praia
**Membros**: Ana, Bruno, Carlos

**Despesas**:
1. Ana pagou hotel: R$ 600 (dividido igualmente entre os 3)
2. Bruno pagou mercado: R$ 150 (dividido igualmente)
3. Carlos pagou jantar: R$ 90 (dividido apenas entre Bruno e Carlos)

**Saldos**:
- Ana: +R$ 350 (a receber)
- Bruno: -R$ 145 (a pagar)
- Carlos: -R$ 205 (a pagar)

**Liquidação Reduzida** (2 transações):
1. Bruno → Ana: R$ 145
2. Carlos → Ana: R$ 205

## 🎨 Interface e Design

- **Cabeçalho com gradiente** roxo/azul moderno
- **Logo SVG** minimalista representando divisão
- **Cards com hover** e animações suaves
- **Cores semânticas**: Verde (crédito), Vermelho (débito), Roxo (ações)
- **Navegação intuitiva** com ícones e estados ativos
- **Layout responsivo** que se adapta ao tamanho da tela

### Responsividade
- **Mobile**: Layout em coluna única, navegação compacta
- **Tablet**: Grid de 2 colunas, melhor uso do espaço
- **Desktop**: Grid fluído, cards de liquidação otimizados

## 🛠️ Tecnologias

- **HTML5**: Estrutura semântica única
- **CSS3**: Gradientes, Grid, Flexbox, Media Queries
- **JavaScript ES6+**: Vanilla JS (sem frameworks)
- **window.print()**: API nativa para PDF
- **localStorage**: Persistência local

## 📊 Algoritmos

### Cálculo de Saldos
```
Para cada despesa:
  Crédito ao pagador: +valor total
  Débito aos participantes: -valor individual

Saldo final = Total Pago - Total Devido
```

### Liquidação Reduzida
```
1. Separar credores (saldo > 0) e devedores (saldo < 0)
2. Ordenar ambos por valor (maior primeiro)
3. Enquanto houver credores e devedores:
   - Transferir min(dívida, crédito)
   - Atualizar saldos
   - Remover se zerou
```

Garante o **mínimo de transações** possível.

## 📁 Estrutura

```
rachaai/
├── index.html          # Arquivo standalone completo (CSS + JS inline)
├── README.md           # Esta documentação
├── index.html.old      # Versão anterior (referência)
├── app.js.old          # JavaScript antigo (referência)
└── styles.css.old      # CSS antigo (referência)
```

**Arquivo principal**: `index.html` (69 KB)

## 🔒 Privacidade

- ✅ Todos os dados são armazenados localmente no navegador
- ✅ Nenhuma informação enviada para servidores
- ✅ Funciona 100% offline
- ✅ Use a exportação JSON para backup

## ✅ Compatibilidade

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 🎯 Melhorias Implementadas

### Versão 2.0 (Atual)
- ✅ Arquivo HTML standalone único
- ✅ CSS inline compactado com gradientes
- ✅ JavaScript inline otimizado
- ✅ Identidade visual moderna
- ✅ Layout de liquidação melhorado para telas grandes
- ✅ PDF com design visual profissional
- ✅ Cards com animações de hover

### Próximas Implementações
- ⏳ Data e hora nas despesas
- ⏳ Filtros por descrição e data
- ⏳ Três modos de divisão (igualitária, por partes, por valor)
- ⏳ Estatísticas de total de despesas por grupo

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas! Este é um projeto educacional demonstrando:
- Desenvolvimento web standalone
- Algoritmos financeiros
- Design responsivo moderno
- Arquitetura client-side

## 📄 Licença

MIT License - Use livremente!

---

**Desenvolvido com ❤️ para facilitar a vida de quem racha contas**

*Racha Aí - Um arquivo, infinitas divisões!*
