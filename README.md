# Racha Aí 💰

WebAplicativo moderno de divisão de despesas em grupo, inspirado no Settle Up.

## 📋 Sobre o Projeto

O **Racha Aí** permite que grupos de pessoas gerenciem despesas compartilhadas de forma simples e eficiente, com:

- ✅ Criação de grupos de despesas
- ✅ Cadastro de membros por grupo
- ✅ Lançamento de despesas compartilhadas
- ✅ Cálculo automático de saldos individuais
- ✅ Instruções de liquidação otimizadas
- ✅ Exportação e importação de dados (JSON)
- ✅ Geração de relatórios em PDF

## 🚀 Funcionalidades

### Gerenciamento de Grupos
- Criar, editar e excluir grupos
- Configurar modo de liquidação (reduzido ou não reduzido)
- Seleção de grupo ativo no cabeçalho

### Gerenciamento de Membros
- Adicionar e editar membros do grupo
- Validação automática (membros em uso não podem ser excluídos)

### Controle de Despesas
- Lançar despesas indicando:
  - Descrição e valor
  - Quem pagou
  - Quem participou da divisão
- Divisão automática e igualitária entre participantes
- Visualização cronológica das despesas

### Cálculo de Saldos
Para cada membro, o sistema calcula:
- **Total Pago**: Soma de todas as despesas pagas
- **Total Devido**: Soma das participações em despesas
- **Saldo Final**: Total Pago - Total Devido
  - Positivo = a receber (crédito)
  - Negativo = a pagar (débito)
  - Zero = quitado

### Liquidação Inteligente

#### Modo NÃO REDUZIDO
Mantém as relações diretas de débito conforme as despesas lançadas. Cada participante paga diretamente para quem pagou a despesa.

#### Modo REDUZIDO (Otimizado)
Aplica algoritmo de compensação que:
- Agrupa credores e devedores
- Compensa valores em cadeia
- **Minimiza o número de transferências financeiras**
- Permite pagamentos indiretos para maior eficiência

### Persistência e Portabilidade
- **Salvamento Automático**: Dados salvos no localStorage do navegador
- **Exportação JSON**: Exporta grupo completo (membros, despesas, configurações)
- **Importação JSON**: Restaura grupo em outro dispositivo/navegador

### Relatório em PDF
Gera PDF profissional contendo:
- Identificação do grupo
- Lista completa de despesas
- Resumo de saldos por membro
- Instruções de liquidação (quem paga quanto e para quem)
- Indicação do modo de redução ativo

## 🎨 Interface e Design

### Identidade Visual
- Nome: **Racha Aí**
- Logo minimalista em SVG (símbolo de divisão/compartilhamento)
- Cores semânticas:
  - Verde: crédito/positivo
  - Vermelho: débito/negativo
  - Roxo/Azul: ação principal

### Responsividade
- **Mobile-first**: Layout otimizado para celulares
- **Tablets**: Uso de múltiplas colunas e melhor aproveitamento do espaço
- **Desktop**: Layout expandido com navegação horizontal

### Navegação
Cinco seções principais:
1. **Grupos**: Gerenciamento de grupos
2. **Membros**: Cadastro de membros do grupo ativo
3. **Despesas**: Lançamento e visualização de despesas
4. **Resumo**: Saldos individuais de cada membro
5. **Liquidação**: Instruções de pagamento para quitar contas

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo com variáveis CSS, flexbox e grid
- **JavaScript (ES6+)**: Lógica da aplicação (vanilla JS)
- **jsPDF**: Geração de relatórios em PDF
- **localStorage**: Persistência de dados no navegador

## 📂 Estrutura do Projeto

```
rachaai/
├── index.html      # Estrutura HTML principal
├── styles.css      # Estilos responsivos
├── app.js          # Lógica da aplicação
└── README.md       # Documentação
```

## 🔧 Como Usar

### 1. Abrir o Aplicativo
Abra o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Safari, Edge).

### 2. Criar um Grupo
1. Clique em "Novo Grupo"
2. Informe o nome do grupo
3. Escolha se deseja ativar a redução de transações
4. Clique em "Salvar"

### 3. Adicionar Membros
1. Selecione o grupo no cabeçalho
2. Vá para a aba "Membros"
3. Clique em "Novo Membro"
4. Informe o nome e salve

### 4. Lançar Despesas
1. Vá para a aba "Despesas"
2. Clique em "Nova Despesa"
3. Preencha:
   - Descrição (ex: "Jantar no Restaurante")
   - Valor total (ex: 150.00)
   - Quem pagou
   - Quem participou (marque os checkboxes)
4. Clique em "Salvar"

### 5. Visualizar Saldos
- Acesse a aba "Resumo" para ver:
  - Quanto cada pessoa pagou
  - Quanto cada pessoa deve
  - Saldo final de cada um

### 6. Ver Instruções de Liquidação
- Acesse a aba "Liquidação" para ver:
  - Quem deve pagar para quem
  - Valores exatos de cada transferência
  - Número total de transações necessárias

### 7. Exportar/Importar Dados
- **Exportar**: Na aba "Liquidação", clique em "Exportar JSON" para baixar os dados do grupo
- **Importar**: Clique em "Importar JSON" e selecione um arquivo previamente exportado

### 8. Gerar Relatório PDF
- Na aba "Liquidação", clique em "Gerar PDF" para criar um relatório completo

## 💡 Exemplo de Uso

### Cenário: Viagem em Grupo

**Grupo**: Viagem Praia 2026
**Membros**: Ana, Bruno, Carlos

**Despesas**:
1. Ana pagou hotel: R$ 600,00 (dividido entre Ana, Bruno, Carlos)
2. Bruno pagou mercado: R$ 150,00 (dividido entre Ana, Bruno, Carlos)
3. Carlos pagou jantar: R$ 90,00 (dividido entre Bruno, Carlos)

**Cálculo de Saldos**:
- **Ana**: Pagou R$ 600,00 | Deve R$ 250,00 | **Saldo: +R$ 350,00** (a receber)
- **Bruno**: Pagou R$ 150,00 | Deve R$ 295,00 | **Saldo: -R$ 145,00** (a pagar)
- **Carlos**: Pagou R$ 90,00 | Deve R$ 245,00 | **Saldo: -R$ 155,00** (a pagar)

**Liquidação Não Reduzida** (3 transações):
1. Bruno paga R$ 200,00 para Ana
2. Bruno paga R$ 45,00 para Carlos
3. Carlos paga R$ 200,00 para Ana

**Liquidação Reduzida** (2 transações):
1. Bruno paga R$ 145,00 para Ana
2. Carlos paga R$ 205,00 para Ana

## 🔒 Privacidade e Segurança

- Todos os dados são armazenados **localmente** no navegador
- Nenhuma informação é enviada para servidores externos
- Para backup, use a função de exportação JSON

## 📱 Compatibilidade

- ✅ Chrome/Edge (versão 90+)
- ✅ Firefox (versão 88+)
- ✅ Safari (versão 14+)
- ✅ Mobile (iOS Safari, Chrome Android)

## 🎯 Algoritmos Implementados

### Cálculo de Saldos
```
Para cada despesa:
  - Crédito ao pagador: +valor total
  - Débito aos participantes: -valor / número de participantes

Saldo final de cada membro:
  = Total Pago - Total Devido
```

### Liquidação Reduzida (Algoritmo Guloso)
```
1. Separar membros em credores (saldo > 0) e devedores (saldo < 0)
2. Ordenar ambos por valor (maior primeiro)
3. Enquanto houver credores e devedores:
   - Pegar maior devedor e maior credor
   - Transferir min(dívida do devedor, crédito do credor)
   - Atualizar saldos
   - Remover da lista se saldo zerou
```

Este algoritmo garante o **mínimo de transações possível** para liquidar todas as contas.

## 🤝 Contribuições

Este é um projeto open-source. Sugestões e melhorias são bem-vindas!

## 📄 Licença

MIT License - use livremente para fins pessoais ou comerciais.

---

**Desenvolvido com ❤️ para facilitar a divisão de despesas em grupo**

*Racha Aí - Dividir ficou mais fácil!*
