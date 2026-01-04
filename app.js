/**
 * Racha Aí - Aplicativo de Divisão de Despesas em Grupo
 *
 * Este aplicativo permite gerenciar despesas compartilhadas entre grupos de pessoas,
 * calculando saldos e gerando instruções de liquidação.
 */

// ============================================
// Estado da Aplicação
// ============================================

const AppState = {
    grupos: [],
    grupoAtivo: null,
    editandoGrupo: null,
    editandoMembro: null,
    editandoDespesa: null
};

// ============================================
// Utilitários
// ============================================

const Utils = {
    /**
     * Gera um ID único
     */
    gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Formata um valor em moeda brasileira
     */
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    },

    /**
     * Formata uma data
     */
    formatarData(timestamp) {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(timestamp));
    },

    /**
     * Mostra uma notificação (alert simplificado)
     */
    notificar(mensagem) {
        alert(mensagem);
    }
};

// ============================================
// Persistência Local
// ============================================

const Storage = {
    CHAVE: 'rachaai_dados',

    /**
     * Salva os dados no localStorage
     */
    salvar() {
        try {
            const dados = JSON.stringify(AppState.grupos);
            localStorage.setItem(this.CHAVE, dados);
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            Utils.notificar('Erro ao salvar dados localmente.');
        }
    },

    /**
     * Carrega os dados do localStorage
     */
    carregar() {
        try {
            const dados = localStorage.getItem(this.CHAVE);
            if (dados) {
                AppState.grupos = JSON.parse(dados);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Utils.notificar('Erro ao carregar dados locais.');
        }
    },

    /**
     * Exporta os dados de um grupo para JSON
     */
    exportarGrupo(grupoId) {
        const grupo = AppState.grupos.find(g => g.id === grupoId);
        if (!grupo) return;

        const dadosExportacao = {
            nome: grupo.nome,
            reducaoTransacoes: grupo.reducaoTransacoes,
            membros: grupo.membros,
            despesas: grupo.despesas,
            exportadoEm: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `racha-ai-${grupo.nome.toLowerCase().replace(/\s+/g, '-')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Importa dados de um arquivo JSON
     */
    importarGrupo(arquivo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);

                // Validação básica
                if (!dados.nome || !dados.membros || !dados.despesas) {
                    throw new Error('Arquivo JSON inválido.');
                }

                // Cria um novo grupo com os dados importados
                const novoGrupo = {
                    id: Utils.gerarId(),
                    nome: dados.nome + ' (Importado)',
                    reducaoTransacoes: dados.reducaoTransacoes || false,
                    membros: dados.membros.map(m => ({
                        ...m,
                        id: Utils.gerarId()
                    })),
                    despesas: dados.despesas.map(d => ({
                        ...d,
                        id: Utils.gerarId(),
                        timestamp: Date.now()
                    }))
                };

                AppState.grupos.push(novoGrupo);
                Storage.salvar();
                UI.renderizarGrupos();
                Utils.notificar('Grupo importado com sucesso!');
            } catch (error) {
                console.error('Erro ao importar:', error);
                Utils.notificar('Erro ao importar arquivo. Verifique se o formato está correto.');
            }
        };
        reader.readAsText(arquivo);
    }
};

// ============================================
// Cálculos Financeiros
// ============================================

const Calculos = {
    /**
     * Calcula o saldo de cada membro do grupo
     */
    calcularSaldos(grupo) {
        const saldos = {};

        // Inicializa os saldos
        grupo.membros.forEach(membro => {
            saldos[membro.id] = {
                nome: membro.nome,
                totalPago: 0,
                totalDevido: 0,
                saldo: 0
            };
        });

        // Processa cada despesa
        grupo.despesas.forEach(despesa => {
            const valorPorParticipante = despesa.valor / despesa.participantes.length;

            // Adiciona crédito ao pagador
            saldos[despesa.pagadorId].totalPago += despesa.valor;

            // Adiciona débito aos participantes
            despesa.participantes.forEach(participanteId => {
                saldos[participanteId].totalDevido += valorPorParticipante;
            });
        });

        // Calcula saldo final
        Object.keys(saldos).forEach(membroId => {
            saldos[membroId].saldo = saldos[membroId].totalPago - saldos[membroId].totalDevido;
        });

        return saldos;
    },

    /**
     * Calcula as transações de liquidação (modo NÃO REDUZIDO)
     * Mantém as relações diretas de débito conforme as despesas
     */
    calcularLiquidacaoNaoReduzida(grupo) {
        const transacoes = [];
        const debitos = {}; // { devedorId: { credorId: valor } }

        // Processa cada despesa para rastrear débitos diretos
        grupo.despesas.forEach(despesa => {
            const valorPorParticipante = despesa.valor / despesa.participantes.length;
            const pagadorId = despesa.pagadorId;

            despesa.participantes.forEach(participanteId => {
                // Se o participante não é o pagador, ele deve ao pagador
                if (participanteId !== pagadorId) {
                    if (!debitos[participanteId]) {
                        debitos[participanteId] = {};
                    }
                    if (!debitos[participanteId][pagadorId]) {
                        debitos[participanteId][pagadorId] = 0;
                    }
                    debitos[participanteId][pagadorId] += valorPorParticipante;
                }
            });
        });

        // Converte os débitos em transações
        Object.keys(debitos).forEach(devedorId => {
            const devedor = grupo.membros.find(m => m.id === devedorId);

            Object.keys(debitos[devedorId]).forEach(credorId => {
                const credor = grupo.membros.find(m => m.id === credorId);
                const valor = debitos[devedorId][credorId];

                if (valor > 0.01) { // Ignora valores muito pequenos
                    transacoes.push({
                        de: devedor.nome,
                        para: credor.nome,
                        valor: valor
                    });
                }
            });
        });

        return transacoes;
    },

    /**
     * Calcula as transações de liquidação (modo REDUZIDO)
     * Minimiza o número de transações usando algoritmo de compensação
     */
    calcularLiquidacaoReduzida(grupo) {
        const saldos = this.calcularSaldos(grupo);
        const credores = [];
        const devedores = [];

        // Separa credores e devedores
        Object.keys(saldos).forEach(membroId => {
            const saldo = saldos[membroId];
            if (saldo.saldo > 0.01) {
                credores.push({
                    id: membroId,
                    nome: saldo.nome,
                    valor: saldo.saldo
                });
            } else if (saldo.saldo < -0.01) {
                devedores.push({
                    id: membroId,
                    nome: saldo.nome,
                    valor: Math.abs(saldo.saldo)
                });
            }
        });

        // Ordena por valor (maior primeiro) para otimizar
        credores.sort((a, b) => b.valor - a.valor);
        devedores.sort((a, b) => b.valor - a.valor);

        const transacoes = [];
        let i = 0, j = 0;

        // Algoritmo guloso para minimizar transações
        while (i < devedores.length && j < credores.length) {
            const devedor = devedores[i];
            const credor = credores[j];

            const valorTransferencia = Math.min(devedor.valor, credor.valor);

            if (valorTransferencia > 0.01) {
                transacoes.push({
                    de: devedor.nome,
                    para: credor.nome,
                    valor: valorTransferencia
                });
            }

            devedor.valor -= valorTransferencia;
            credor.valor -= valorTransferencia;

            if (devedor.valor < 0.01) i++;
            if (credor.valor < 0.01) j++;
        }

        return transacoes;
    }
};

// ============================================
// Geração de PDF
// ============================================

const PDFGenerator = {
    /**
     * Gera um relatório em PDF do grupo ativo
     */
    gerarRelatorio() {
        if (!AppState.grupoAtivo) {
            Utils.notificar('Nenhum grupo selecionado.');
            return;
        }

        const grupo = AppState.grupoAtivo;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let y = 20;
        const lineHeight = 7;
        const pageHeight = doc.internal.pageSize.height;

        // Função auxiliar para adicionar nova página se necessário
        const checkPageBreak = () => {
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }
        };

        // Título
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Racha Aí - Relatório de Despesas', 105, y, { align: 'center' });
        y += lineHeight * 2;

        // Nome do Grupo
        doc.setFontSize(16);
        doc.text(`Grupo: ${grupo.nome}`, 20, y);
        y += lineHeight * 1.5;

        // Data de geração
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Gerado em: ${Utils.formatarData(Date.now())}`, 20, y);
        y += lineHeight;

        // Configuração
        doc.text(`Redução de transações: ${grupo.reducaoTransacoes ? 'Ativa' : 'Inativa'}`, 20, y);
        y += lineHeight * 2;

        // Membros
        checkPageBreak();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Membros', 20, y);
        y += lineHeight;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        grupo.membros.forEach((membro, index) => {
            checkPageBreak();
            doc.text(`${index + 1}. ${membro.nome}`, 25, y);
            y += lineHeight;
        });
        y += lineHeight;

        // Despesas
        checkPageBreak();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Despesas', 20, y);
        y += lineHeight;

        if (grupo.despesas.length === 0) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            doc.text('Nenhuma despesa lançada.', 25, y);
            y += lineHeight * 2;
        } else {
            grupo.despesas.forEach((despesa, index) => {
                checkPageBreak();
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${despesa.descricao}`, 25, y);
                y += lineHeight;

                doc.setFont(undefined, 'normal');
                const pagador = grupo.membros.find(m => m.id === despesa.pagadorId);
                doc.text(`   Valor: ${Utils.formatarMoeda(despesa.valor)}`, 25, y);
                y += lineHeight;
                doc.text(`   Pagador: ${pagador.nome}`, 25, y);
                y += lineHeight;

                const participantes = despesa.participantes
                    .map(id => grupo.membros.find(m => m.id === id)?.nome)
                    .join(', ');
                doc.text(`   Participantes: ${participantes}`, 25, y);
                y += lineHeight * 1.5;
            });
        }

        // Resumo de Saldos
        checkPageBreak();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Resumo de Saldos', 20, y);
        y += lineHeight;

        const saldos = Calculos.calcularSaldos(grupo);
        Object.values(saldos).forEach(saldo => {
            checkPageBreak();
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(saldo.nome, 25, y);
            y += lineHeight;

            doc.setFont(undefined, 'normal');
            doc.text(`   Total Pago: ${Utils.formatarMoeda(saldo.totalPago)}`, 25, y);
            y += lineHeight;
            doc.text(`   Total Devido: ${Utils.formatarMoeda(saldo.totalDevido)}`, 25, y);
            y += lineHeight;

            const saldoTexto = saldo.saldo >= 0
                ? `Crédito de ${Utils.formatarMoeda(saldo.saldo)}`
                : `Débito de ${Utils.formatarMoeda(Math.abs(saldo.saldo))}`;
            doc.setFont(undefined, 'bold');
            doc.text(`   Saldo: ${saldoTexto}`, 25, y);
            y += lineHeight * 1.5;
        });

        // Instruções de Liquidação
        checkPageBreak();
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Instruções de Liquidação', 20, y);
        y += lineHeight;

        const transacoes = grupo.reducaoTransacoes
            ? Calculos.calcularLiquidacaoReduzida(grupo)
            : Calculos.calcularLiquidacaoNaoReduzida(grupo);

        if (transacoes.length === 0) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            doc.text('Todas as contas estão quitadas!', 25, y);
        } else {
            transacoes.forEach((transacao, index) => {
                checkPageBreak();
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.text(
                    `${index + 1}. ${transacao.de} paga ${Utils.formatarMoeda(transacao.valor)} para ${transacao.para}`,
                    25, y
                );
                y += lineHeight;
            });
        }

        // Salva o PDF
        doc.save(`racha-ai-${grupo.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    }
};

// ============================================
// Interface do Usuário
// ============================================

const UI = {
    /**
     * Inicializa os event listeners
     */
    inicializar() {
        // Navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navegarPara(section);
            });
        });

        // Seletor de grupo ativo
        document.getElementById('activeGroupSelect').addEventListener('change', (e) => {
            const grupoId = e.target.value;
            this.selecionarGrupo(grupoId);
        });

        // Botões de nova entidade
        document.getElementById('btnNovoGrupo').addEventListener('click', () => this.abrirModalGrupo());
        document.getElementById('btnNovoMembro').addEventListener('click', () => this.abrirModalMembro());
        document.getElementById('btnNovaDespesa').addEventListener('click', () => this.abrirModalDespesa());

        // Modais - Grupo
        document.getElementById('btnFecharModalGrupo').addEventListener('click', () => this.fecharModalGrupo());
        document.getElementById('btnCancelarGrupo').addEventListener('click', () => this.fecharModalGrupo());
        document.getElementById('btnSalvarGrupo').addEventListener('click', () => this.salvarGrupo());

        // Modais - Membro
        document.getElementById('btnFecharModalMembro').addEventListener('click', () => this.fecharModalMembro());
        document.getElementById('btnCancelarMembro').addEventListener('click', () => this.fecharModalMembro());
        document.getElementById('btnSalvarMembro').addEventListener('click', () => this.salvarMembro());

        // Modais - Despesa
        document.getElementById('btnFecharModalDespesa').addEventListener('click', () => this.fecharModalDespesa());
        document.getElementById('btnCancelarDespesa').addEventListener('click', () => this.fecharModalDespesa());
        document.getElementById('btnSalvarDespesa').addEventListener('click', () => this.salvarDespesa());

        // Ações de liquidação
        document.getElementById('btnExportar').addEventListener('click', () => {
            if (AppState.grupoAtivo) {
                Storage.exportarGrupo(AppState.grupoAtivo.id);
            } else {
                Utils.notificar('Nenhum grupo selecionado.');
            }
        });

        document.getElementById('btnImportar').addEventListener('click', () => {
            document.getElementById('inputImportarJSON').click();
        });

        document.getElementById('inputImportarJSON').addEventListener('change', (e) => {
            const arquivo = e.target.files[0];
            if (arquivo) {
                Storage.importarGrupo(arquivo);
            }
            e.target.value = ''; // Reset
        });

        document.getElementById('btnGerarPDF').addEventListener('click', () => {
            PDFGenerator.gerarRelatorio();
        });

        // Renderização inicial
        this.renderizarGrupos();
        this.navegarPara('grupos');
    },

    /**
     * Navega para uma seção
     */
    navegarPara(section) {
        // Remove active de todos os itens
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Adiciona active ao item clicado
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Esconde todas as seções
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.add('hidden');
        });

        // Mostra a seção selecionada
        document.getElementById(`section-${section}`).classList.remove('hidden');

        // Renderiza o conteúdo da seção
        switch (section) {
            case 'grupos':
                this.renderizarGrupos();
                break;
            case 'membros':
                this.renderizarMembros();
                break;
            case 'despesas':
                this.renderizarDespesas();
                break;
            case 'resumo':
                this.renderizarResumo();
                break;
            case 'liquidacao':
                this.renderizarLiquidacao();
                break;
        }
    },

    /**
     * Seleciona um grupo como ativo
     */
    selecionarGrupo(grupoId) {
        if (grupoId) {
            AppState.grupoAtivo = AppState.grupos.find(g => g.id === grupoId);
        } else {
            AppState.grupoAtivo = null;
        }

        // Atualiza a UI
        this.renderizarMembros();
        this.renderizarDespesas();
        this.renderizarResumo();
        this.renderizarLiquidacao();
    },

    /**
     * Renderiza a lista de grupos
     */
    renderizarGrupos() {
        const container = document.getElementById('listaGrupos');
        container.innerHTML = '';

        if (AppState.grupos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum grupo criado ainda. Clique em "Novo Grupo" para começar.</div>';
            return;
        }

        AppState.grupos.forEach(grupo => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${grupo.nome}</h3>
                    <div class="card-actions">
                        <button class="btn btn-small btn-secondary" onclick="UI.editarGrupo('${grupo.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="UI.excluirGrupo('${grupo.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <span class="card-info-label">Membros:</span>
                        <span class="card-info-value">${grupo.membros.length}</span>
                    </div>
                    <div class="card-info">
                        <span class="card-info-label">Despesas:</span>
                        <span class="card-info-value">${grupo.despesas.length}</span>
                    </div>
                    <div class="card-info">
                        <span class="card-info-label">Redução de transações:</span>
                        <span class="card-info-value">${grupo.reducaoTransacoes ? 'Ativa' : 'Inativa'}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Atualiza o seletor de grupos
        this.atualizarSeletorGrupos();
    },

    /**
     * Atualiza o seletor de grupos no cabeçalho
     */
    atualizarSeletorGrupos() {
        const select = document.getElementById('activeGroupSelect');
        select.innerHTML = '<option value="">Selecione um grupo</option>';

        AppState.grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;
            option.textContent = grupo.nome;
            if (AppState.grupoAtivo && AppState.grupoAtivo.id === grupo.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    },

    /**
     * Renderiza a lista de membros
     */
    renderizarMembros() {
        const container = document.getElementById('listaMembros');
        const emptyState = document.getElementById('emptyStateMembros');

        if (!AppState.grupoAtivo) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        if (AppState.grupoAtivo.membros.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum membro cadastrado. Clique em "Novo Membro" para adicionar.</div>';
            return;
        }

        container.innerHTML = '';
        AppState.grupoAtivo.membros.forEach(membro => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${membro.nome}</h3>
                    <div class="card-actions">
                        <button class="btn btn-small btn-secondary" onclick="UI.editarMembro('${membro.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="UI.excluirMembro('${membro.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * Renderiza a lista de despesas
     */
    renderizarDespesas() {
        const container = document.getElementById('listaDespesas');
        const emptyState = document.getElementById('emptyStateDespesas');

        if (!AppState.grupoAtivo || AppState.grupoAtivo.membros.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        if (AppState.grupoAtivo.despesas.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma despesa lançada. Clique em "Nova Despesa" para adicionar.</div>';
            return;
        }

        container.innerHTML = '';
        // Ordena por timestamp (mais recente primeiro)
        const despesasOrdenadas = [...AppState.grupoAtivo.despesas].sort((a, b) => b.timestamp - a.timestamp);

        despesasOrdenadas.forEach(despesa => {
            const pagador = AppState.grupoAtivo.membros.find(m => m.id === despesa.pagadorId);
            const participantes = despesa.participantes
                .map(id => AppState.grupoAtivo.membros.find(m => m.id === id)?.nome)
                .join(', ');

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${despesa.descricao}</h3>
                    <div class="card-actions">
                        <button class="btn btn-small btn-danger" onclick="UI.excluirDespesa('${despesa.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <span class="card-info-label">Valor:</span>
                        <span class="card-info-value valor">${Utils.formatarMoeda(despesa.valor)}</span>
                    </div>
                    <div class="card-info">
                        <span class="card-info-label">Pagador:</span>
                        <span class="card-info-value">${pagador ? pagador.nome : 'Desconhecido'}</span>
                    </div>
                    <div class="card-info">
                        <span class="card-info-label">Participantes:</span>
                        <span class="card-info-value">${participantes}</span>
                    </div>
                    <div class="card-info">
                        <span class="card-info-label">Valor por pessoa:</span>
                        <span class="card-info-value">${Utils.formatarMoeda(despesa.valor / despesa.participantes.length)}</span>
                    </div>
                    <div class="card-info">
                        <span class="card-info-label text-muted">Data:</span>
                        <span class="card-info-value text-muted">${Utils.formatarData(despesa.timestamp)}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * Renderiza o resumo de saldos
     */
    renderizarResumo() {
        const container = document.getElementById('listaResumo');
        const emptyState = document.getElementById('emptyStateResumo');

        if (!AppState.grupoAtivo || AppState.grupoAtivo.despesas.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        const saldos = Calculos.calcularSaldos(AppState.grupoAtivo);

        Object.values(saldos).forEach(saldo => {
            const saldoClass = saldo.saldo > 0.01 ? 'saldo-positivo' : saldo.saldo < -0.01 ? 'saldo-negativo' : 'saldo-zero';
            const badgeClass = saldo.saldo > 0.01 ? 'badge-success' : saldo.saldo < -0.01 ? 'badge-danger' : 'badge-neutral';
            const statusTexto = saldo.saldo > 0.01 ? 'A RECEBER' : saldo.saldo < -0.01 ? 'A PAGAR' : 'QUITADO';

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${saldo.nome}</h3>
                    <span class="badge ${badgeClass}">${statusTexto}</span>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <span class="card-info-label">Total Pago:</span>
                        <span class="card-info-value">${Utils.formatarMoeda(saldo.totalPago)}</span>
                    </div>
                    <div class="card-info">
                        <span class="card-info-label">Total Devido:</span>
                        <span class="card-info-value">${Utils.formatarMoeda(saldo.totalDevido)}</span>
                    </div>
                    <div class="card-info" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-gray-200);">
                        <span class="card-info-label" style="font-size: var(--font-size-lg);">Saldo Final:</span>
                        <span class="card-info-value saldo ${saldoClass}">${Utils.formatarMoeda(Math.abs(saldo.saldo))}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * Renderiza as instruções de liquidação
     */
    renderizarLiquidacao() {
        const container = document.getElementById('liquidacaoContent');
        const emptyState = document.getElementById('emptyStateLiquidacao');

        if (!AppState.grupoAtivo || AppState.grupoAtivo.despesas.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        const transacoes = AppState.grupoAtivo.reducaoTransacoes
            ? Calculos.calcularLiquidacaoReduzida(AppState.grupoAtivo)
            : Calculos.calcularLiquidacaoNaoReduzida(AppState.grupoAtivo);

        if (transacoes.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        // Informação sobre o modo
        const infoDiv = document.createElement('div');
        infoDiv.className = 'liquidacao-config';
        infoDiv.innerHTML = `
            <h3 style="margin-bottom: 12px;">Modo de Liquidação</h3>
            <p style="color: var(--color-gray-600);">
                ${AppState.grupoAtivo.reducaoTransacoes
                    ? '<strong>Redução Ativa:</strong> As transações foram otimizadas para minimizar o número de transferências. Pode haver pagamentos indiretos.'
                    : '<strong>Redução Inativa:</strong> As transações mantêm as relações diretas conforme as despesas lançadas.'}
            </p>
            <p style="margin-top: 8px; color: var(--color-gray-600);">
                <strong>Total de transações:</strong> ${transacoes.length}
            </p>
        `;
        container.appendChild(infoDiv);

        // Transações
        transacoes.forEach((transacao, index) => {
            const item = document.createElement('div');
            item.className = 'liquidacao-item';
            item.innerHTML = `
                <div style="flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-gray-100); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--color-gray-600);">
                    ${index + 1}
                </div>
                <div class="liquidacao-de" style="flex: 1; text-align: left;">
                    <div style="font-size: var(--font-size-sm); color: var(--color-gray-500); margin-bottom: 4px;">De</div>
                    <div style="font-size: var(--font-size-lg); font-weight: 600;">${transacao.de}</div>
                </div>
                <div class="liquidacao-arrow">→</div>
                <div class="liquidacao-para" style="flex: 1; text-align: left;">
                    <div style="font-size: var(--font-size-sm); color: var(--color-gray-500); margin-bottom: 4px;">Para</div>
                    <div style="font-size: var(--font-size-lg); font-weight: 600;">${transacao.para}</div>
                </div>
                <div style="flex: 0 0 auto; text-align: right;">
                    <div style="font-size: var(--font-size-sm); color: var(--color-gray-500); margin-bottom: 4px;">Valor</div>
                    <div class="liquidacao-valor">${Utils.formatarMoeda(transacao.valor)}</div>
                </div>
            `;
            container.appendChild(item);
        });
    },

    // ============================================
    // Modais - Grupo
    // ============================================

    abrirModalGrupo(grupoId = null) {
        const modal = document.getElementById('modalGrupo');
        const titulo = document.getElementById('modalGrupoTitulo');
        const inputNome = document.getElementById('inputNomeGrupo');
        const inputReducao = document.getElementById('inputReducaoTransacoes');

        if (grupoId) {
            AppState.editandoGrupo = AppState.grupos.find(g => g.id === grupoId);
            titulo.textContent = 'Editar Grupo';
            inputNome.value = AppState.editandoGrupo.nome;
            inputReducao.checked = AppState.editandoGrupo.reducaoTransacoes;
        } else {
            AppState.editandoGrupo = null;
            titulo.textContent = 'Novo Grupo';
            inputNome.value = '';
            inputReducao.checked = false;
        }

        modal.classList.add('active');
        inputNome.focus();
    },

    fecharModalGrupo() {
        document.getElementById('modalGrupo').classList.remove('active');
        AppState.editandoGrupo = null;
    },

    salvarGrupo() {
        const inputNome = document.getElementById('inputNomeGrupo');
        const inputReducao = document.getElementById('inputReducaoTransacoes');

        const nome = inputNome.value.trim();
        if (!nome) {
            Utils.notificar('Por favor, informe o nome do grupo.');
            return;
        }

        if (AppState.editandoGrupo) {
            // Editando
            AppState.editandoGrupo.nome = nome;
            AppState.editandoGrupo.reducaoTransacoes = inputReducao.checked;
        } else {
            // Criando
            const novoGrupo = {
                id: Utils.gerarId(),
                nome: nome,
                reducaoTransacoes: inputReducao.checked,
                membros: [],
                despesas: []
            };
            AppState.grupos.push(novoGrupo);

            // Seleciona automaticamente o novo grupo
            AppState.grupoAtivo = novoGrupo;
        }

        Storage.salvar();
        this.renderizarGrupos();
        this.fecharModalGrupo();
    },

    editarGrupo(grupoId) {
        this.abrirModalGrupo(grupoId);
    },

    excluirGrupo(grupoId) {
        if (!confirm('Tem certeza que deseja excluir este grupo? Todos os membros e despesas serão perdidos.')) {
            return;
        }

        AppState.grupos = AppState.grupos.filter(g => g.id !== grupoId);

        if (AppState.grupoAtivo && AppState.grupoAtivo.id === grupoId) {
            AppState.grupoAtivo = null;
        }

        Storage.salvar();
        this.renderizarGrupos();
        this.selecionarGrupo(null);
    },

    // ============================================
    // Modais - Membro
    // ============================================

    abrirModalMembro(membroId = null) {
        if (!AppState.grupoAtivo) {
            Utils.notificar('Selecione um grupo primeiro.');
            return;
        }

        const modal = document.getElementById('modalMembro');
        const titulo = document.getElementById('modalMembroTitulo');
        const inputNome = document.getElementById('inputNomeMembro');

        if (membroId) {
            AppState.editandoMembro = AppState.grupoAtivo.membros.find(m => m.id === membroId);
            titulo.textContent = 'Editar Membro';
            inputNome.value = AppState.editandoMembro.nome;
        } else {
            AppState.editandoMembro = null;
            titulo.textContent = 'Novo Membro';
            inputNome.value = '';
        }

        modal.classList.add('active');
        inputNome.focus();
    },

    fecharModalMembro() {
        document.getElementById('modalMembro').classList.remove('active');
        AppState.editandoMembro = null;
    },

    salvarMembro() {
        const inputNome = document.getElementById('inputNomeMembro');
        const nome = inputNome.value.trim();

        if (!nome) {
            Utils.notificar('Por favor, informe o nome do membro.');
            return;
        }

        if (AppState.editandoMembro) {
            // Editando
            AppState.editandoMembro.nome = nome;
        } else {
            // Criando
            const novoMembro = {
                id: Utils.gerarId(),
                nome: nome
            };
            AppState.grupoAtivo.membros.push(novoMembro);
        }

        Storage.salvar();
        this.renderizarMembros();
        this.fecharModalMembro();
    },

    editarMembro(membroId) {
        this.abrirModalMembro(membroId);
    },

    excluirMembro(membroId) {
        // Verifica se o membro está sendo usado em alguma despesa
        const emUso = AppState.grupoAtivo.despesas.some(d =>
            d.pagadorId === membroId || d.participantes.includes(membroId)
        );

        if (emUso) {
            Utils.notificar('Este membro não pode ser excluído pois está associado a despesas.');
            return;
        }

        if (!confirm('Tem certeza que deseja excluir este membro?')) {
            return;
        }

        AppState.grupoAtivo.membros = AppState.grupoAtivo.membros.filter(m => m.id !== membroId);
        Storage.salvar();
        this.renderizarMembros();
    },

    // ============================================
    // Modais - Despesa
    // ============================================

    abrirModalDespesa(despesaId = null) {
        if (!AppState.grupoAtivo) {
            Utils.notificar('Selecione um grupo primeiro.');
            return;
        }

        if (AppState.grupoAtivo.membros.length === 0) {
            Utils.notificar('Cadastre membros antes de lançar despesas.');
            return;
        }

        const modal = document.getElementById('modalDespesa');
        const titulo = document.getElementById('modalDespesaTitulo');
        const inputDescricao = document.getElementById('inputDescricaoDespesa');
        const inputValor = document.getElementById('inputValorDespesa');
        const selectPagador = document.getElementById('selectPagador');
        const checkboxContainer = document.getElementById('checkboxParticipantes');

        // Popula o select de pagador
        selectPagador.innerHTML = '<option value="">Selecione...</option>';
        AppState.grupoAtivo.membros.forEach(membro => {
            const option = document.createElement('option');
            option.value = membro.id;
            option.textContent = membro.nome;
            selectPagador.appendChild(option);
        });

        // Popula os checkboxes de participantes
        checkboxContainer.innerHTML = '';
        AppState.grupoAtivo.membros.forEach(membro => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" name="participante" value="${membro.id}">
                ${membro.nome}
            `;
            checkboxContainer.appendChild(label);
        });

        if (despesaId) {
            AppState.editandoDespesa = AppState.grupoAtivo.despesas.find(d => d.id === despesaId);
            titulo.textContent = 'Editar Despesa';
            inputDescricao.value = AppState.editandoDespesa.descricao;
            inputValor.value = AppState.editandoDespesa.valor;
            selectPagador.value = AppState.editandoDespesa.pagadorId;

            // Marca os participantes
            AppState.editandoDespesa.participantes.forEach(pId => {
                const checkbox = checkboxContainer.querySelector(`input[value="${pId}"]`);
                if (checkbox) checkbox.checked = true;
            });
        } else {
            AppState.editandoDespesa = null;
            titulo.textContent = 'Nova Despesa';
            inputDescricao.value = '';
            inputValor.value = '';
            selectPagador.value = '';
        }

        modal.classList.add('active');
        inputDescricao.focus();
    },

    fecharModalDespesa() {
        document.getElementById('modalDespesa').classList.remove('active');
        AppState.editandoDespesa = null;
    },

    salvarDespesa() {
        const inputDescricao = document.getElementById('inputDescricaoDespesa');
        const inputValor = document.getElementById('inputValorDespesa');
        const selectPagador = document.getElementById('selectPagador');
        const checkboxes = document.querySelectorAll('input[name="participante"]:checked');

        const descricao = inputDescricao.value.trim();
        const valor = parseFloat(inputValor.value);
        const pagadorId = selectPagador.value;
        const participantes = Array.from(checkboxes).map(cb => cb.value);

        // Validações
        if (!descricao) {
            Utils.notificar('Por favor, informe a descrição da despesa.');
            return;
        }

        if (!valor || valor <= 0) {
            Utils.notificar('Por favor, informe um valor válido.');
            return;
        }

        if (!pagadorId) {
            Utils.notificar('Por favor, selecione quem pagou.');
            return;
        }

        if (participantes.length === 0) {
            Utils.notificar('Por favor, selecione pelo menos um participante.');
            return;
        }

        if (AppState.editandoDespesa) {
            // Editando
            AppState.editandoDespesa.descricao = descricao;
            AppState.editandoDespesa.valor = valor;
            AppState.editandoDespesa.pagadorId = pagadorId;
            AppState.editandoDespesa.participantes = participantes;
        } else {
            // Criando
            const novaDespesa = {
                id: Utils.gerarId(),
                descricao: descricao,
                valor: valor,
                pagadorId: pagadorId,
                participantes: participantes,
                timestamp: Date.now()
            };
            AppState.grupoAtivo.despesas.push(novaDespesa);
        }

        Storage.salvar();
        this.renderizarDespesas();
        this.renderizarResumo();
        this.renderizarLiquidacao();
        this.fecharModalDespesa();
    },

    excluirDespesa(despesaId) {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
            return;
        }

        AppState.grupoAtivo.despesas = AppState.grupoAtivo.despesas.filter(d => d.id !== despesaId);
        Storage.salvar();
        this.renderizarDespesas();
        this.renderizarResumo();
        this.renderizarLiquidacao();
    }
};

// ============================================
// Inicialização
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    Storage.carregar();
    UI.inicializar();
});
