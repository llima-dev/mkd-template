
    let currentTemplateId = null;
    let nomeTarefa = '';
    let blocosDeCodigo = [];
    let linksExternos = [];
    let editandoIndex = null;
    let comentariosAtencao = [];
    let comentarioEditandoIndex = null;

    function escaparUnderscores(texto) {
      return texto.replace(/_/g, '\\_');
    }

    let preparativos = [];
    let passos = [];

    function adicionarPreparativo() {
        preparativos.push({
            titulo: '',
            passos: []
        });
        renderizarPreparativos();
    }

    function adicionarPasso() {
        const input = document.getElementById('novoPasso');
        const valor = input.value.trim();
        const estavaFocado = document.activeElement === input;

        if (valor !== '') {
            passos.push({ texto: valor, critico: false, criteriosVinculados: [] });
            input.value = '';
            renderizarPassos();

            if (estavaFocado) input.focus();
        }
    }

    function adicionarDivisoria() {
      passos.push({
        texto: '-----------',
        critico: false,
        isDivisoria: true,
        criteriosVinculados: []
      });

      renderizarPassos();
    }

    function removerPasso(index) {
        passos.splice(index, 1);
        renderizarPassos();
    }

    function removerPreparativo(index) {
        preparativos.splice(index, 1);
        renderizarPreparativos();
    }

    function adicionarPassoPreparativo(index) {
        const input = document.getElementById(`prepPassoInput${index}`);
        const valor = input.value.trim();

        if (valor !== '') {
            preparativos[index].passos.push(valor);
            input.value = '';
            renderizarPreparativos();
        }
    }

function removerPassoPreparativo(prepIndex, passoIndex) {
    preparativos[prepIndex].passos.splice(passoIndex, 1);
    renderizarPreparativos();
}

function renderizarPreparativos() {
    const container = document.getElementById('containerPreparativos');
    container.innerHTML = '';

    const estados = carregarEstadoColapsaveis();
    preparativos.forEach((prep, i) => {
        const div = document.createElement('div');
        div.className = 'card my-3';

        div.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center flex-grow-1 gap-2">
                <button class="btn btn-delete-light btn-sm prep-header-btn" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#prepCollapse${i}" 
                        aria-expanded="true" 
                        aria-controls="prepCollapse${i}">
                    <i class="fas fa-caret-down rotate-icon" id="caretIcon${i}"></i>
                </button>
                <input type="text" class="form-control form-control-sm" placeholder="Título do preparativo"
                    value="${prep.titulo}" onchange="preparativos[${i}].titulo = this.value">
            </div>
            <button class="btn btn-sm btn-outline-danger ms-2 btn-delete-prep" onclick="removerPreparativo(${i})">
                Remover
            </button>
        </div>

        <div id="prepCollapse${i}" class="collapse ${estados[i] !== false ? 'show' : ''}">
            <div class="card-body">
                <div class="input-group mb-2 position-relative">
                    <input type="text" class="form-control" placeholder="Novo passo" id="prepPassoInput${i}"
                        oninput="inputPreparativoHandler(event, ${i})"
                        onblur="setTimeout(esconderSugestoes, 150)"
                        onkeypress="if(event.key==='Enter'){event.preventDefault(); adicionarPassoPreparativo(${i})}">
                    <button class="btn btn-outline-success" onclick="adicionarPassoPreparativo(${i})">
                        <i class="fas fa-plus"></i>
                    </button>
                    <div class="list-group position-absolute z-3 sug-autocomplete" id="prepSugestoes${i}" style="display: none;"></div>
                </div>
                <ul class="list-group" id="prepPassosList${i}">
                ${prep.passos.map((p, j) => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center flex-grow-1 gap-2">
                        <i class="fas fa-grip-vertical drag-handle text-muted"></i>
                        <span class="editable flex-grow-1" onclick="editarPassoPreparativo(${i}, ${j}, this)">
                            ${p}
                        </span>
                    </div>
                    <button class="btn btn-sm btn-outline-danger btn-delete-prep" onclick="removerPassoPreparativo(${i}, ${j})">
                        <small>Remover</small>
                    </button>
                    </li>
                `).join('')}
                </ul>
            </div>
        </div>
        `;

        // Event listeners para sugestões e atalhos
        setTimeout(() => {
            const input = document.getElementById('prepPassoInput' + i);
            if (input) {
                input.addEventListener('input', function (e) {
                    aplicarSubstituicoesSeta(e.target);
                    atualizarSugestoesPorParenteses(e.target, `prepSugestoes${i}`);
                    if (e.target.value.trim() === '/') {
                        mostrarModalBlocos(i);
                    }
                });

                input.addEventListener('blur', () =>
                    setTimeout(() => esconderSugestoes(`prepSugestoes${i}`), 150)
                );
            }
        }, 0);

        container.appendChild(div);
        
        requestAnimationFrame(() => {
          const ul = document.getElementById(`prepPassosList${i}`);
          if (ul) {
            Sortable.create(ul, {
              animation: 150,
              ghostClass: "sortable-ghost",
              handle: ".drag-handle",
              onEnd: function (evt) {
                const movedItem = preparativos[i].passos.splice(
                  evt.oldIndex,
                  1
                )[0];
                preparativos[i].passos.splice(evt.newIndex, 0, movedItem);
                salvarDraft();

                numerarPassos(ul);

                const items = ul.querySelectorAll("li .editable");
                items.forEach((el, idx) => {
                const texto = el.textContent.replace(/^\d+\.\s*/, "").trim();
                el.textContent = `${idx + 1}. ${texto}`;
                });
              },
            });
          } else {
            console.warn(`UL #prepPassosList${i} não encontrado`);
          }

          numerarPassos(ul);
        });          

        setTimeout(() => {
            const collapseEl = document.getElementById(`prepCollapse${i}`);
            const caret = document.getElementById(`caretIcon${i}`);
            
            const updateCaret = () => {
              if (collapseEl.classList.contains('show')) {
                caret.classList.remove('collapsed');
              } else {
                caret.classList.add('collapsed');
              }
            };
          
            collapseEl.addEventListener('shown.bs.collapse', () => {
              updateCaret();
              salvarEstadoColapsaveis();
            });
          
            collapseEl.addEventListener('hidden.bs.collapse', () => {
              updateCaret();
              salvarEstadoColapsaveis();
            });
          
            // Atualiza já na renderização
            updateCaret();
          }, 0); 
    });
}

function numerarPassos(ul) {
  const items = ul.querySelectorAll("li .editable");
  items.forEach((el, idx) => {
    const texto = el.textContent.replace(/^\d+\.\s*/, "").trim();
    el.textContent = `${idx + 1}. ${texto}`;
  });
}

function editarPassoPreparativo(prepIndex, passoIndex, spanEl) {
  const textoOriginal = preparativos[prepIndex].passos[passoIndex];
  const input = document.createElement("input");
  input.type = "text";
  input.value = textoOriginal;
  input.className = "form-control form-control-sm";
  input.style.flex = "1";

  const sugId = `prepSugestoesEdicao${prepIndex}_${passoIndex}`;

  // Criar o container de sugestões
  const sugContainer = document.createElement("div");
  sugContainer.className = "list-group position-absolute z-3 sug-autocomplete";
  sugContainer.id = sugId;
  sugContainer.style.display = "none";

  // Encaixar container na hierarquia
  setTimeout(() => {
    input.parentElement?.appendChild(sugContainer);
  }, 0);

  input.oninput = function (e) {
    aplicarSubstituicoesSeta(e.target);
    atualizarSugestoesPorParenteses(e.target, sugId);
  };

  input.onblur = function () {
    setTimeout(() => {
      esconderSugestoes(sugId);
      salvarEdicao();
    }, 150);
  };

  input.onkeypress = function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      salvarEdicao();
    }
  };

  function salvarEdicao() {
    const novoValor = input.value.trim();
    if (novoValor !== "") {
      preparativos[prepIndex].passos[passoIndex] = novoValor;
      renderizarPreparativos();
    }
  }

  spanEl.replaceWith(input);
  input.focus();
}  

function renderizarPassos() {
  const lista = document.getElementById('listaPassos');
  lista.innerHTML = '';
  let numeroVisivel = 1;

  let etapaContador = 1;
  
  passos.forEach((passo, index) => {
    const li = document.createElement('li');
    li.dataset.index = index;
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.style.cursor = 'pointer';

    if (!passo.isDivisoria) {
      li.setAttribute('onclick', `selecionarCriterios(${index})`);
    }

    if (passo.isDivisoria) {
      li.classList.add('divisoria');
    }

    if (passo.isDivisoria) {
      li.className = 'list-group-item divisoria d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <span class="etiqueta-etapa">--- Etapa ${etapaContador++} ---</span>
        <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); removerPasso(${index})" title="Remover divisória">
          <i class="fas fa-minus"></i>
        </button>
      `;
      lista.appendChild(li);
      return;
    }

    const criteriosBadge = passo.criteriosVinculados?.length
      ? `<span class="badge bg-warning text-dark ms-2 fw-semibold">${formatarListaOrdinal(
          passo.criteriosVinculados.map(c => c + 1)
        )}</span>`
      : '';

    const numero = passo.isDivisoria ? '' : `${numeroVisivel}. `;
    if (!passo.isDivisoria) numeroVisivel++;

    li.innerHTML = `
      <div class="d-flex align-items-center flex-grow-1 gap-2">
        <i class="fas fa-grip-vertical text-muted drag-handle"></i>
        <span class="flex-grow-1">
          ${escaparUnderscores(numero + passo.texto)}${criteriosBadge}
        </span>
      </div>
      <button class="btn btn-outline-danger btn-sm btn-delete-prep" onclick="event.stopPropagation(); removerPasso(${index})">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;

    lista.appendChild(li);
  });

  setTimeout(() => {
    if (!window.sortablePassosIniciado) {
      Sortable.create(lista, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: function (evt) {
          const novaOrdem = Array.from(lista.children).map(li => {
            const idx = parseInt(li.dataset.index, 10);
            return passos[idx];
          });
          passos = novaOrdem;
          salvarDraft();
          renderizarPassos();
        }
      });
      window.sortablePassosIniciado = true;
    }
  }, 0);
}


    function formatarListaOrdinal(numeros) {
        if (numeros.length === 1) return `critério ${numeros[0]}`;
        const ultimos = numeros.slice(0, -1).join(', ');
        return `critérios ${ultimos} e ${numeros[numeros.length - 1]}`;
    }

    let criterios = [];

    function adicionarCriterio() {
        const input = document.getElementById('novoCriterio');
        const valor = input.value.trim();
        const estavaFocado = document.activeElement === input;

        if (valor !== '') {
            criterios.push(valor);
            input.value = '';
            renderizarCriterios();

            if (estavaFocado) input.focus();
        }
    }

    function removerCriterio(index) {
        criterios.splice(index, 1);
        renderizarCriterios();
    }

    function renderizarCriterios() {
    const lista = document.getElementById('listaCriterios');
    lista.innerHTML = '';
    criterios.forEach((criterio, index) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
        <span>${escaparUnderscores((index + 1) + '. ' + criterio)}</span>
        <button class="btn btn-sm btn-outline-danger btn-delete-prep" onclick="removerCriterio(${index})">
            <i class="fas fa-trash"></i>
        </button>
        `;
        lista.appendChild(li);
    });
    }

    // Enter para adicionar critério
    document.getElementById('novoCriterio').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            adicionarCriterio();
        }
    });

    // Permitir Enter para adicionar passo
    document.getElementById('novoPasso').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        adicionarPasso();
    }
    });

    function gerar() {
    const escopo = escaparUnderscores(document.getElementById('escopo').value.trim());
    const criteriosTexto = criterios.map((c, i) => `${i + 1}. ${escaparUnderscores(c)}`).join('\n');
    const impactoBruto = document.getElementById('impacto').value.trim();
    const impacto = escaparUnderscores(
    impactoBruto.replace(/\(([A-Z]{2}\d{3})\)/g, '(**$1**)')
    );

  const navegadoresSelecionados = document.getElementById('chrome').checked || document.getElementById('edge').checked;
  const bancosSelecionados = document.getElementById('sqlserver').checked || document.getElementById('oracleIso').checked || document.getElementById('postgres').checked || document.getElementById('oracleUtf').checked;
  
  if (!navegadoresSelecionados || !bancosSelecionados) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos obrigatórios',
      text: 'Você precisa selecionar pelo menos um navegador e um banco de dados para gerar o template.',
    });
    return;
  }

  const preparativosTexto = preparativos.map((p, i) => {
  const titulo = p.titulo ? ` (**${p.titulo}**)` : '';
  const passos = p.passos.map((passo, j) =>
    `${j + 1}. ${escaparUnderscores(passo.replace(/\(([A-Z]{2}\d{3})\)/g, '(**$1**)'))}`
    ).join('\n');
  return `### :rosette: Preparativo ${i + 1}${titulo}\n${passos}`;}).join('\n\n');

  let passosTexto = '';
  let passoNumero = 1;
  let etapaContador = 1;

  passos.forEach(p => {
    if (p.isDivisoria) {
      passosTexto += `\n--- Etapa ${etapaContador} ---\n\n`;
      etapaContador++;
    } else {
      const textoLimpo = escaparUnderscores(
        p.texto.replace(/\(([A-Z]{2}\d{3})\)/g, '(**$1**)')
      );

      const sufixo = p.criteriosVinculados?.length
        ? ` :warning: (${p.criteriosVinculados.map(c => c + 1).join(',')})`
        : '';

      passosTexto += `${passoNumero}. ${textoLimpo}${sufixo}\n`;
      passoNumero++;
    }
  });

  const chrome = document.getElementById('chrome').checked ? "* [X] Google Chrome\n" : "* [ ] Google Chrome\n";
  const edge = document.getElementById('edge').checked ? "* [X] Microsoft Edge\n" : "* [ ] Microsoft Edge\n";

  const sqlserver = document.getElementById('sqlserver').checked ? "    * [X] SQL Server\n" : "    * [ ] SQL Server\n";
  const oracleIso = document.getElementById('oracleIso').checked ? "    * [X] Oracle\n" : "    * [ ] Oracle\n";
  const postgres = document.getElementById('postgres').checked ? "    * [X] PostGreSQL\n" : "    * [ ] PostGreSQL\n";
  const oracleUtf = document.getElementById('oracleUtf').checked ? "    * [X] Oracle\n" : "    * [ ] Oracle\n";

    let markdown = `### :star: Escopo \n\n 1. *${escopo}*
    `;

    const blocosTexto = blocosDeCodigo.map((b) => {
        const titulo = b.titulo ? `#####  ${b.titulo}\n` : '';
        return `${titulo}\`\`\`${b.linguagem}\n${b.codigo}\n\`\`\``;
      }).join('\n\n');

    if (comentariosAtencao.length > 0) {
      const comentariosMd = comentariosAtencao.map(c => `> ${escaparUnderscores(c)}`).join('\n\n');
      markdown += `\n### :exclamation: Pontos de atenção\n\n${comentariosMd}\n`;
    }

    if (blocosTexto) {
      markdown += `\n### :notebook: Código auxiliar\n${blocosTexto}\n`;
    }

    if (preparativosTexto) {
        markdown += `\n____\n${preparativosTexto}\n`;
    }

    if (linksExternos.length) {
      const linksMarkdown = linksExternos
        .map(link => `* [${link.titulo}](${link.url})`)
        .join('\n');
  
        markdown += `\n____\n### :link: Links auxiliares\n${linksMarkdown}\n`;
    }

    let flowText = '';
    const incluirFluxograma = document.getElementById("incluirFluxograma")?.checked;

    if (incluirFluxograma && nomeTarefa) {
      abrirVisualizacaoFluxo(false);
      const diagramaMermaid = document.getElementById("fluxoMermaid")?.innerText?.trim() || '';
      
      if (diagramaMermaid) {
        const krokiUrl = abrirNoKroki();
        flowText += `> Diagrama do teste [visualizar](${krokiUrl})\n`;
      }
    }

markdown += `
____
### :mans_shoe: Passos
${passosTexto}
${flowText}
____
### :warning: Critério de aceitação
${criteriosTexto}
____
### :triangular_flag_on_post: Impacto
${impacto}
____
### :ship: Navegadores testados:
${chrome}${edge}____
### :game_die: Bancos de dados testados:
* **ISO 8859-1**:
${sqlserver}${oracleIso}* **UTF8**:
${postgres}${oracleUtf}
### :eyeglasses: [Evidências](https://www.youtube.com/watch?v=ePjtnSPFWK8)
* Evidências:
   * [X]  [DEV](#evidencia_dev)
   * [ ]  [CROSS](#evidencia_cross)
   * [ ]  [QA](#evidencia_qa)`;

  document.getElementById('resultado').value = markdown;
  document.getElementById('copy_btn').disabled = false;

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Markdown gerado com sucesso!',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });

    return document.getElementById('resultado').value;
}

  
  let passoSelecionadoIndex = null;

  function selecionarCriterios(index) {
    passoSelecionadoIndex = index;
    const container = document.getElementById("listaCriteriosModal");
    const input = document.getElementById("editarTextoPasso");
    input.value = passos[index].texto;

    // Limpa conteúdo anterior
    container.innerHTML = "";

    if (!criterios.length) {
      container.innerHTML =
        '<p class="text-muted">Nenhum critério foi adicionado ainda.</p>';
    } else {
      criterios.forEach((criterio, i) => {
        const checkbox = document.createElement("div");
        checkbox.className = "form-check";

        const isChecked = passos[index].criteriosVinculados.includes(i);

        checkbox.innerHTML = `
          <input class="form-check-input" type="checkbox" value="${i}" id="criterioCheck${i}" ${
          isChecked ? "checked" : ""
        }>
          <label class="form-check-label" for="criterioCheck${i}">
            ${i + 1}. ${escaparUnderscores(criterio)}
          </label>
        `;

        container.appendChild(checkbox);
      });
    }

    // Remover eventos antigos pra evitar duplicação
    input.replaceWith(input.cloneNode(true));
    const newInput = document.getElementById("editarTextoPasso");

    // ID do container de sugestões
    const sugId = "sugestoesEdicaoModal";

    // Criar container se não existir
    let sugContainer = document.getElementById(sugId);
    if (!sugContainer) {
      sugContainer = document.createElement("div");
      sugContainer.className =
        "list-group position-absolute z-3 sug-autocomplete";
      sugContainer.id = sugId;
      sugContainer.style.display = "none";

      newInput.parentElement?.classList.add("position-relative");
      newInput.parentElement?.appendChild(sugContainer);
    }

    // Substituir '>' e ativar autocomplete com '('
    newInput.addEventListener("input", function (e) {
      aplicarSubstituicoesSeta(e.target);
      atualizarSugestoesPorParenteses(e.target, sugId);
    });

    newInput.addEventListener("blur", function () {
      setTimeout(() => esconderSugestoes(sugId), 150);
    });

    // Modal ON
    const modal = new bootstrap.Modal(
      document.getElementById("modalCriterios")
    );
    modal.show();

    // (Opcional) Selecionar texto ao abrir
    setTimeout(() => newInput.select(), 100);
  }  

  function confirmarVinculoCriterios() {
    const checkboxes = document.querySelectorAll('#listaCriteriosModal input[type=checkbox]');
    const selecionados = [];

    checkboxes.forEach(cb => {
      if (cb.checked) {
        selecionados.push(parseInt(cb.value));
      }
    });

    if (passoSelecionadoIndex !== null) {
      passos[passoSelecionadoIndex].criteriosVinculados = selecionados;
      renderizarPassos();
    }

    if (passoSelecionadoIndex !== null) {
        passos[passoSelecionadoIndex].texto = document.getElementById('editarTextoPasso').value.trim();
        passos[passoSelecionadoIndex].criteriosVinculados = selecionados;
        renderizarPassos();
    }

    const modalEl = document.getElementById('modalCriterios');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  }

  function copiarResultado() {
    const texto = document.getElementById('resultado').value;
    navigator.clipboard.writeText(texto).then(() => {
        Swal.fire({
        icon: 'success',
        title: 'Copiado!',
        text: 'O markdown foi copiado para a área de transferência.',
        timer: 2000,
        showConfirmButton: false
        });
    }).catch(() => {
        Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'Não foi possível copiar o texto.',
        });
    });
}

window.addEventListener('beforeunload', () => {
    salvarDraft();
});

function salvarDraft() {
  const id = currentTemplateId || gerarIdTemplate();
  currentTemplateId = id;

  nomeTarefa = document.getElementById("nomeTarefa").value.trim();

  const draft = {
    templateId: id,
    nomeTarefa,
    escopo: document.getElementById("escopo").value,
    impacto: document.getElementById("impacto").value,
    criterios,
    passos,
    blocosDeCodigo,
    preparativos,
    comentariosAtencao,
    navegadores: {
      chrome: document.getElementById("chrome").checked,
      edge: document.getElementById("edge").checked,
    },
    bancos: {
      sqlserver: document.getElementById("sqlserver").checked,
      oracleIso: document.getElementById("oracleIso").checked,
      postgres: document.getElementById("postgres").checked,
      oracleUtf: document.getElementById("oracleUtf").checked,
    },
  };

  localStorage.setItem('linksExternos', JSON.stringify(linksExternos));
  localStorage.setItem("template_gitlab_draft", JSON.stringify(draft));
}

window.addEventListener('DOMContentLoaded', () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('template_gitlab_'));
  
  if (keys.length > 0) {
    const draft = localStorage.getItem('template_gitlab_draft');
    const data = JSON.parse(draft);
    currentTemplateId = data.templateId || keys[0].replace('template_gitlab_', '');

    document.getElementById('nomeTarefa').value = data.nomeTarefa || '';
    nomeTarefa = data.nomeTarefa || 'Gerador de Template GitLab';

    document.getElementById('tituloPrincipal').innerHTML = `
    <i class="fas fa-tools"></i> Gerador de Template GitLab 
    ${nomeTarefa ? `<small class="text-muted">(${nomeTarefa})</small>` : ''}
    `;

    document.title = nomeTarefa + '-template' || 'Gerador de Template GitLab';

    // Restaurar campos simples
    document.getElementById('escopo').value = data.escopo || '';
    document.getElementById('impacto').value = data.impacto || '';

    // Restaurar navegadores
    document.getElementById('chrome').checked = data.navegadores?.chrome || false;
    document.getElementById('edge').checked = data.navegadores?.edge || false;

    // Restaurar bancos
    document.getElementById('sqlserver').checked = data.bancos?.sqlserver || false;
    document.getElementById('oracleIso').checked = data.bancos?.oracleIso || false;
    document.getElementById('postgres').checked = data.bancos?.postgres || false;
    document.getElementById('oracleUtf').checked = data.bancos?.oracleUtf || false;

    const salvarPreferenciaFluxograma = localStorage.getItem("incluirFluxograma");
    if (salvarPreferenciaFluxograma !== null) {
      document.getElementById("incluirFluxograma").checked = salvarPreferenciaFluxograma === "true";
    }

    document.getElementById('impacto').addEventListener('input', function (e) {
      aplicarSubstituicoesSeta(e.target);
    });

    const linksSalvos = localStorage.getItem('linksExternos');
    if (linksSalvos) {
      linksExternos = JSON.parse(linksSalvos);
      renderizarLinksExternos();
    }

    // Restaurar critérios e passos
    criterios = data.criterios || [];
    passos = data.passos || [];
    preparativos = data.preparativos || [];

    blocosDeCodigo = data.blocosDeCodigo || [];
    comentariosAtencao = data.comentariosAtencao || [];

    renderizarComentariosPreview();    
    renderizarBlocosDeCodigo();
    renderizarCriterios();
    renderizarPassos();
    renderizarPreparativos();

    // Atualiza visual
    document.getElementById('nomeExportar').value = nomeTarefa;
  }
});

document.getElementById('nomeTarefa').addEventListener('input', (e) => {
  const valor = e.target.value.trim();
  nomeTarefa = valor;
  document.title = valor + '-TEMPLATE-TESTES' || 'Gerador de Template GitLab';
  document.getElementById('nomeExportar').value = nomeTarefa;
  
  document.getElementById('tituloPrincipal').innerHTML = `
    <i class="fas fa-tools"></i> Gerador de Template GitLab 
    ${valor ? `<small class="text-muted">(${valor})</small>` : ''}
  `;
});

document.addEventListener('keydown', function (e) {
  if (e.altKey && e.key === 'Enter') {
    e.preventDefault();
    gerar();
  }
});

function limparDraft() {
  Swal.fire({
    icon: "question",
    title: "Apagar rascunho salvo?",
    text: "Todos os dados armazenados localmente serão perdidos.",
    showCancelButton: true,
    confirmButtonText: "Sim, apagar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const keyToDelete = currentTemplateId
        ? `template_gitlab_${currentTemplateId}`
        : "gitlab_template_draft";
      localStorage.removeItem(keyToDelete);

      // Campos de texto
      document.getElementById("nomeTarefa").value = "";
      document.getElementById("escopo").value = "";
      document.getElementById("impacto").value = "";
      document.getElementById("novoPasso").value = "";
      document.getElementById("novoCriterio").value = "";
      document.getElementById("resultado").value = "";

      // Campos do modal de código
      document.getElementById("tituloCodigo").value = "";
      document.getElementById("linguagemCodigo").value = "php";
      document.getElementById("blocoCodigo").value = "";

      // Checkboxes
      document.getElementById("chrome").checked = false;
      document.getElementById("edge").checked = false;
      document.getElementById("sqlserver").checked = false;
      document.getElementById("oracleIso").checked = false;
      document.getElementById("postgres").checked = false;
      document.getElementById("oracleUtf").checked = false;

      // Arrays
      passos = [];
      criterios = [];
      preparativos = [];
      blocosDeCodigo = [];
      blocoEditandoIndex = null;
      comentariosAtencao = [];

      // Renderizações
      renderizarPassos();
      renderizarCriterios();
      renderizarPreparativos();
      renderizarBlocosDeCodigo();
      renderizarComentariosPreview();

      // Reset título e ID
      currentTemplateId = null;
      nomeTarefa = "";
      document.title = "Gerador de Template GitLab";
      document.getElementById("tituloPrincipal").innerHTML = `
          <i class="fas fa-tools"></i> Gerador de Template GitLab
        `;

      Swal.fire({
        icon: "success",
        title: "Rascunho apagado!",
        text: "Agora está tudo limpo. 🧼",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  });
}
  

function mostrarSugestoes(filtroParcial, inputRef, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const sugestoesFiltradas = sugestoesAutoComplete.filter(s =>
        s.id.toLowerCase().startsWith(filtroParcial.toLowerCase())
    );

    if (!sugestoesFiltradas.length) {
        container.style.display = 'none';
        return;
    }

  sugestoesFiltradas.forEach(sugestao => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-group-item list-group-item-action';
    item.textContent = sugestao;
    item.style.backgroundColor = '#cfe2ff';

    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const textoAtual = inputRef.value;
      const inicioParenteses = textoAtual.lastIndexOf('(');
      inputRef.value = textoAtual.slice(0, inicioParenteses) + `${sugestao.name} (${sugestao.id}) `;
      container.style.display = 'none';
      inputRef.focus();
    });

    container.appendChild(item);
  });

  container.style.display = 'block';
}

function inputPreparativoHandler(event, index) {
  const input = event.target;
  aplicarSubstituicoesSeta(input);

  const valor = input.value;
  const indexParenteses = valor.lastIndexOf('(');
  if (indexParenteses !== -1) {
    mostrarSugestoes(
      valor.slice(indexParenteses + 1).toLowerCase(),
      input,
      `prepSugestoes${index}`
    );
  } else {
    esconderSugestoes(`prepSugestoes${index}`);
  }
}

function esconderSugestoes(id = null) {
  if (id) {
    const container = document.getElementById(id);
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  } else {
    document.querySelectorAll('.sug-autocomplete').forEach(container => {
      container.style.display = 'none';
      container.innerHTML = '';
    });
  }
}

document.getElementById('impacto').addEventListener('focus', function (e) {
  if (e.target.value.trim() === '') {
    e.target.value = '1. ';
  }
});

document.getElementById('impacto').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const textarea = e.target;
    const linhas = textarea.value.split('\n');
    const linhaAtual = linhas.length + 1;
    
    textarea.value += `\n${linhaAtual}. `;
    
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
  }
});

function exportarJson() {
  const data = {
        escopo: document.getElementById('escopo').value,
        impacto: document.getElementById('impacto').value,
        criterios,
        passos,
        blocosDeCodigo,
        preparativos,
        linksExternos,
        comentariosAtencao,
        incluirFluxograma: document.getElementById("incluirFluxograma").checked,
        navegadores: {
            chrome: document.getElementById('chrome').checked,
            edge: document.getElementById('edge').checked
        },
        bancos: {
            sqlserver: document.getElementById('sqlserver').checked,
            oracleIso: document.getElementById('oracleIso').checked,
            postgres: document.getElementById('postgres').checked,
            oracleUtf: document.getElementById('oracleUtf').checked
        }
  };

  data.templateId = currentTemplateId || gerarIdTemplate();
  data.nomeTarefa = document.getElementById('nomeTarefa').value.trim();

  const nome = (nomeTarefa ? nomeTarefa.replace(/\s+/g, '-').toLowerCase() : 'template_gitlab');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nome}.json`;
  link.click();

  // Fecha o modal após exportar
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalExportar'));
  modal.hide();

  Swal.fire({
    icon: 'success',
    title: 'Exportado com sucesso!',
    text: `Arquivo "${nome}.json" baixado.`,
    timer: 2000,
    showConfirmButton: false
  });
}

function gerarIdTemplate() {
  return 'tpl-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

function importarArquivoJson() {
  const fileInput = document.getElementById('arquivoJson');
  const file = fileInput.files[0];

  if (!file) {
    Swal.fire('Nenhum arquivo selecionado', 'Escolha um arquivo JSON para importar.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      currentTemplateId = data.templateId || gerarIdTemplate();

        nomeTarefa = data.nomeTarefa || '';
        document.getElementById('nomeTarefa').value = nomeTarefa;

        // Atualiza título
        document.getElementById('tituloPrincipal').innerHTML = `
        <i class="fas fa-tools"></i> Gerador de Template GitLab 
        ${nomeTarefa ? `<small class="text-muted">(${nomeTarefa})</small>` : ''}
        `;
        document.title = nomeTarefa + '-template' || 'Gerador de Template GitLab';

      // Aplica os dados no formulário
      document.getElementById('escopo').value = data.escopo || '';
      document.getElementById('impacto').value = data.impacto || '';
      criterios = data.criterios || [];
      passos = (data.passos || []).map(p => ({
        texto: p.texto || '',
        critico: p.critico || false,
        criteriosVinculados: p.criteriosVinculados || [],
        isDivisoria: p.isDivisoria === true
      }));
      preparativos = data.preparativos || [];
      blocosDeCodigo = data.blocosDeCodigo || [];

      linksExternos = data.linksExternos || [];
      comentariosAtencao = data.comentariosAtencao || [];
      
      renderizarComentariosPreview();
      renderizarLinksExternos();
      renderizarBlocosDeCodigo(); 
      renderizarPreparativos();
      renderizarCriterios();
      renderizarPassos();

      document.getElementById('chrome').checked = data.navegadores?.chrome || false;
      document.getElementById('edge').checked = data.navegadores?.edge || false;
      document.getElementById('sqlserver').checked = data.bancos?.sqlserver || false;
      document.getElementById('oracleIso').checked = data.bancos?.oracleIso || false;
      document.getElementById('postgres').checked = data.bancos?.postgres || false;
      document.getElementById('oracleUtf').checked = data.bancos?.oracleUtf || false;
      document.getElementById("incluirFluxograma").checked = data.incluirFluxograma;

      // Fecha modal e avisa
      const modalEl = document.getElementById('modalImportar');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      const nomeArquivo =
      data.nomeTarefa?.trim() ||
      file.name.replace('.json', '') ||
      'template_gitlab';
  
      document.getElementById('nomeExportar').value = nomeArquivo;
  
      document.getElementById('tituloPrincipal').innerHTML =
      `<i class="fas fa-tools"></i> Gerador de Template GitLab <small class="text-muted">(${nomeArquivo})</small>`;

      Swal.fire({
        icon: 'success',
        title: 'Importado com sucesso!',
        text: 'O template foi carregado e está pronto para uso.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Erro!', 'O arquivo não é um JSON válido.', 'error');
    }
  };

  reader.readAsText(file);
}

function aplicarSubstituicoesSeta(elemento) {
  const cursor = elemento.selectionStart;
  const antes = elemento.value;
  const depois = antes.replace(/ > /g, ' → ').replace(/> /g, '→ ').replace(/ >(?=\S)/g, ' →');

  if (antes !== depois) {
    elemento.value = depois;
    elemento.selectionEnd = cursor;
  }
}

document.getElementById('novoPasso').addEventListener('input', function (e) {
  aplicarSubstituicoesSeta(e.target);

  const valor = e.target.value;
  const indexParenteses = valor.lastIndexOf('(');
  if (indexParenteses !== -1) {
    mostrarSugestoes(valor.slice(indexParenteses + 1).toLowerCase(), e.target, 'sugestoesPasso');
  } else {
    esconderSugestoes();
  }
});

document.getElementById('novoPasso').addEventListener('blur', () => setTimeout(() => esconderSugestoes('sugestoesPasso'), 150));

let blocosDePassos = [];

if (typeof window.getBlocosDePassos === 'function') {
    blocosDePassos = window.getBlocosDePassos();
}

document.getElementById('novoPasso').addEventListener('input', function (e) {
  const valor = e.target.value;
  if (valor.trim() === '/') {
    mostrarModalBlocos();
  }
});

function mostrarModalBlocos(prepIndex = null) {
  const modalBody = document.getElementById('modalBlocosBody');
  modalBody.innerHTML = '';

  blocosDePassos.forEach((bloco, index) => {
    const btn = document.createElement('button');
    btn.className = 'list-group-item list-group-item-action';
    btn.textContent = bloco.titulo;
    btn.onclick = () => aplicarBlocoDePassos(index, prepIndex);
    modalBody.appendChild(btn);
  });

  const modalEl = document.getElementById('modalBlocos');
  let modal = bootstrap.Modal.getInstance(modalEl);

  if (!modal) {
    modal = new bootstrap.Modal(modalEl);
  }

  modal.show();
}

function aplicarBlocoDePassos(blocoIndex, prepIndex = null) {
  const bloco = blocosDePassos[blocoIndex];

  if (prepIndex === null) {
    // Insere nos passos principais
    bloco.passos.forEach(p => {
      passos.push({
        texto: p.texto,
        critico: false,
        criteriosVinculados: []
      });
    });
    renderizarPassos();
  } else {
    // Insere nos preparativos[prepIndex].passos
    bloco.passos.forEach(p => {
      preparativos[prepIndex].passos.push(p.texto);
    });
    renderizarPreparativos();
  }

  document.getElementById('novoPasso').value = '';
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalBlocos'));
  modal.hide();
}

let sugestoesAutoComplete = [];
if (typeof window.getSugestoesAutoComplete === 'function') {
  sugestoesAutoComplete = window.getSugestoesAutoComplete();
}

function getPrefixosValidos() {
  return [...new Set(sugestoesAutoComplete.map(s => s.id.match(/^[A-Z]+/)[0]))];
}

function atualizarSugestoesPorParenteses(inputEl, containerId) {
  const texto = inputEl.value;
  const indexParenteses = texto.lastIndexOf('(');

  if (indexParenteses === -1) {
    esconderSugestoes(containerId);
    return;
  }

  const filtroParcial = texto.slice(indexParenteses + 1).toLowerCase();

  const sugestoesFiltradas = sugestoesAutoComplete.filter(s =>
    s.id.toLowerCase().startsWith(filtroParcial)
  );

    const container = document.getElementById(containerId);
    container.innerHTML = '';
    sugestoesFiltradas.forEach(s => {
    const item = document.createElement('li');
    item.className = 'list-group-item list-group-item-action';
    item.textContent = `${s.name} (${s.id})`;
    item.dataset.id = s.id;
    item.dataset.name = s.name;

    item.onclick = () => {
        const textoAtual = inputEl.value;
        const prefixo = textoAtual.slice(0, indexParenteses);
        inputEl.value = prefixo + `${s.name} (${s.id}) `;
        container.style.display = 'none';
        inputEl.focus();
    };

    container.appendChild(item);
    });
    container.style.display = 'block';
}

document.getElementById('novoPasso').addEventListener('input', function (e) {
  aplicarSubstituicoesSeta(e.target);
  atualizarSugestoesPorParenteses(e.target, 'sugestoesPasso');

  if (e.target.value.trim() === '/') {
    mostrarModalBlocos();
  }
});

document.getElementById('novoPasso').addEventListener('blur', () =>
  setTimeout(() => esconderSugestoes('sugestoesPasso'), 150)
);

function salvarEstadoColapsaveis() {
  const estados = preparativos.map((_, i) => {
    const el = document.getElementById(`prepCollapse${i}`);
    return el?.classList.contains("show");
  });
  localStorage.setItem("estadoPreparativos", JSON.stringify(estados));
}

function carregarEstadoColapsaveis() {
  const raw = localStorage.getItem("estadoPreparativos");
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
  
function inserirBlocoDeCodigo() {
  const titulo = document.getElementById("tituloCodigo").value.trim();
  const linguagem = document.getElementById("linguagemCodigo").value;
  const codigo = document.getElementById("blocoCodigo").value.trim();

  if (!codigo) {
    Swal.fire("Atenção!", "O bloco de código está vazio.", "warning");
    return;
  }

  const bloco = { titulo, linguagem, codigo };

  if (blocoEditandoIndex !== null) {
    blocosDeCodigo[blocoEditandoIndex] = bloco;
    blocoEditandoIndex = null;
  } else {
    blocosDeCodigo.push(bloco);
  }

  // Limpar campos
  document.getElementById("tituloCodigo").value = "";
  document.getElementById("linguagemCodigo").value = "php";
  document.getElementById("blocoCodigo").value = "";

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalCodigo")
  );
  modal.hide();

  renderizarBlocosDeCodigo();

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "Código salvo!",
    showConfirmButton: false,
    timer: 2000,
  });
}  
  
function renderizarBlocosDeCodigo() {
  const container = document.getElementById("containerBlocosCodigo");
  container.innerHTML = "";

  if (blocosDeCodigo.length === 0) return;

  blocosDeCodigo.forEach((bloco, i) => {
    const preview =
      bloco.codigo.length > 60
        ? bloco.codigo.substring(0, 60) + "..."
        : bloco.codigo;

    const card = document.createElement("div");
    card.className = 'card mb-3 card-bloco-codigo shadow-sm';

    const toggleBtnId = `toggleBtn${i}`;
    const id = `codigoCollapse${i}`;
    const colapsado = bloco.codigo.split('\n').length > 15;
    const collapsedClass = colapsado ? 'collapse' : '';

    card.innerHTML = `
    <div id="${id}" class="${collapsedClass}">
        ${bloco.titulo ? `<div class="titulo-codigo">${bloco.titulo}</div>` : ''}
        <pre><code class="language-${bloco.linguagem}">${hljs.highlight(bloco.codigo, { language: bloco.linguagem }).value}</code></pre>
    </div>
    ${colapsado ? `
        <button class="btn-toggle-codigo" id="${toggleBtnId}" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="false" aria-controls="${id}">
        Mostrar código completo...
        </button>
    ` : ''}
    <div class="card-body">
        <strong class="text-uppercase text-muted">${bloco.linguagem}</strong>
        <div class="ms-auto d-flex gap-2">
        <button class="btn btn-sm btn-secondary-light" onclick="editarBlocoDeCodigo(${i})">
            <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-delete-prep" onclick="removerBlocoDeCodigo(${i})">
            <i class="fas fa-trash"></i>
        </button>
        </div>
    </div>
    `;

    container.appendChild(card);

    if (colapsado) {
      const toggleBtn = document.getElementById(toggleBtnId);
      const collapseEl = document.getElementById(id);

      collapseEl.addEventListener("show.bs.collapse", () => {
        toggleBtn.textContent = "Esconder código";
      });

      collapseEl.addEventListener("hide.bs.collapse", () => {
        toggleBtn.textContent = "Mostrar código completo";
      });
    }      
  });

  hljs.highlightAll();
}

let blocoEditandoIndex = null;

function editarBlocoDeCodigo(index) {
  const bloco = blocosDeCodigo[index];
  document.getElementById("tituloCodigo").value = bloco.titulo || "";
  document.getElementById("linguagemCodigo").value = bloco.linguagem;
  document.getElementById("blocoCodigo").value = bloco.codigo;
  blocoEditandoIndex = index;

  const modal = new bootstrap.Modal(document.getElementById("modalCodigo"));
  modal.show();
}

function removerBlocoDeCodigo(index) {
  blocosDeCodigo.splice(index, 1);
  renderizarBlocosDeCodigo();
}

function abrirPreviewMarkdown() {
  const markdownBruto = gerar();
  const markdownComEmojis = substituirShortcodesPorEmojis(markdownBruto);

  const html = marked.parse(markdownComEmojis, {
    highlight: function (code, lang) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch {
        return code;
      }
    },
    breaks: true,
    gfm: true,
  });

  const container = document.getElementById("previewMarkdownContent");
  container.innerHTML = html;
  container.classList.add("markdown-body");

  const modal = new bootstrap.Modal(document.getElementById("modalPreview"));
  modal.show();
}
  
  
function substituirShortcodesPorEmojis(texto) {
  const mapa = {
    ":star:": "⭐",
    ":rosette:": "🏵️",
    ":notebook:": "📓",
    ":rocket:": "🚀",
    ":bug:": "🐛",
    ":wrench:": "🔧",
    ":clipboard:": "📋",
    ":warning:": "⚠️",
    ":gear:": "⚙️",
    ":mans_shoe:": "👞",
    ":triangular_flag_on_post:": "🚩",
    ":ship:": "🚢",
    ":game_die:": "🎲",
    ":eyeglasses:": "👓",
    ":link:": "🔗",
    ":chart:": "💹",
    ":exclamation:": "❗️"
  };

  return texto.replace(/:[^:\s]+:/g, match => mapa[match] || match);
}
  
function exportarPDF() {
  const element = document.getElementById("previewMarkdownContent");
  const opt = {
    margin:       [0.5, 0.5, 0.7, 0.5], // top, left, bottom, right
    filename:     `template-${nomeTarefa || "sem-nome"}.pdf`,
    image:        { type: "jpeg", quality: 0.98 },
    html2canvas:  {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      windowHeight: element.scrollHeight
    },
    jsPDF:        { unit: "in", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
}

function inicializarOrdenacaoPassos() {
  const lista = document.getElementById("listaPassos");
  if (!lista) return;

  new Sortable(lista, {
    animation: 150,
    ghostClass: "sortable-ghost",
    onEnd: function () {
      const novaOrdem = Array.from(lista.children).map(li => {
        const idx = parseInt(li.dataset.index, 10);
        return passos[idx];
      });

      passos = novaOrdem;

      salvarDraft();
      renderizarPassos();
    },
  });
}

inicializarOrdenacaoPassos();

function abrirModalLink() {
  document.getElementById('tituloLink').value = '';
  document.getElementById('urlLink').value = '';
  const modal = new bootstrap.Modal(document.getElementById('modalLink'));
  modal.show();
}

function salvarLink() {
  const titulo = document.getElementById('tituloLink').value.trim();
  const url = document.getElementById('urlLink').value.trim();

  if (!titulo) {
    Swal.fire('Campos obrigatórios', 'Preencha título e URL.', 'warning');
    return;
  }

  if (editandoIndex !== null) {
    // Edição
    linksExternos[editandoIndex] = { titulo, url };
  } else {
    // Adição
    linksExternos.push({ titulo, url });
  }

  renderizarLinksExternos();
  salvarDraft();

  const modal = bootstrap.Modal.getInstance(document.getElementById('modalLink'));
  modal.hide();
  editandoIndex = null; // resetar após salvar
}

function renderizarLinksExternos() {
  const container = document.getElementById('listaLinksExternos');
  container.innerHTML = '';

  linksExternos.forEach((link, index) => {
    const item = document.createElement('div');
    item.className = 'link-externo-item';
    item.innerHTML = `
      <span><a href="${link.url}" class="text-primary" title="${link.url}" target="_blank"><i class="fas fa-link"></i> ${link.titulo}</a></span>
      <div>
        <button class="btn btn-sm btn-secondary-light me-1" onclick="editarLink(${index})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-delete-prep" onclick="removerLink(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    container.appendChild(item);
  });
}

function editarLink(index) {
  const link = linksExternos[index];
  editandoIndex = index;

  document.getElementById('tituloLink').value = link.titulo;
  document.getElementById('urlLink').value = link.url;

  const modal = new bootstrap.Modal(document.getElementById('modalLink'));
  modal.show();
}

function removerLink(index) {
  linksExternos.splice(index, 1);
  salvarDraft();
  renderizarLinksExternos();
}

function abrirVisualizacaoFluxo(show = true) {
  let diagrama = 'flowchart LR\n';
  diagrama += `A[Tarefa: ${nomeTarefa || 'Sem nome'}]:::etapa\n`;
  diagrama += `A --> PX[Passos de Teste]:::etapa\n`;

  let passoNumero = 1;
  let prev = 'PX';
  let etapaContador = 1;

  passos.forEach((p, idx) => {
    if (!p.texto || typeof p.texto !== "string") return;

    const textoLimpo = p.texto.trim();

    // Se for divisória, cria um nó visual de etapa
    if (textoLimpo.startsWith("Etapa") || p.isDivisoria) {
      const eid = `E${etapaContador}`;
      const nomeEtapa = /^[\-]+$/.test(textoLimpo) ? `Etapa ${etapaContador}` : textoLimpo;
      diagrama += `${prev} --> ${eid}["${nomeEtapa}"]:::etapa\n`;
      prev = eid;
      etapaContador++;
      return;
    }

    // Caso seja um passo real
    const id = `S${idx}`;
    const texto = sanitizarTextoMermaid(`${passoNumero++} - ${textoLimpo}`);
    const critico = Array.isArray(p.criteriosVinculados) && p.criteriosVinculados.length > 1;
    const classe = critico ? 'critico' : 'passo';

    diagrama += `${prev} --> ${id}["${texto}"]:::${classe}\n`;
    prev = id;

    // Critérios vinculados
    if (Array.isArray(p.criteriosVinculados)) {
      p.criteriosVinculados.forEach((criterioIdx, j) => {
        const cid = `C_${idx}_${j}`;
        const textoCrit = sanitizarTextoMermaid(criterios[criterioIdx] || `Critério ${criterioIdx + 1}`);
        diagrama += `${id} -- critério --> ${cid}["${textoCrit}"]:::criterio\n`;
      });
    }
  });

  // Estilos visuais
  diagrama += `
    classDef etapa fill:#fff3cd,stroke:#856404,stroke-width:2px,color:#000;
    classDef passo fill:#b2ebf2,stroke:#00796b,color:#000;
    classDef critico fill:#ef9a9a,stroke:#b71c1c,stroke-width:2px,color:#000;
    classDef criterio fill:#e1bee7,stroke:#663399,color:#000;
  `;

  // Renderização
  const container = document.getElementById("fluxoMermaid");
  container.innerHTML = "";

  const novo = document.createElement("div");
  novo.className = "mermaid";
  novo.style.visibility = "hidden";
  novo.innerHTML = diagrama;
  container.appendChild(novo);

  const modalEl = document.getElementById("modalFluxo");
  const modal = new bootstrap.Modal(modalEl);

  modalEl.addEventListener("shown.bs.modal", function onShow() {
    mermaid.init(undefined, novo);

    setTimeout(() => {
      novo.style.visibility = "visible"; 
      const svg = container.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.maxHeight = "none";

        svgPanZoom(svg, {
          zoomEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true,
          minZoom: 0.2,
          maxZoom: 10,
          contain: true
        });
      }
    }, 150);

    modalEl.removeEventListener("shown.bs.modal", onShow);
  });

  modalEl.addEventListener("hidden.bs.modal", function onHide() {
    container.innerHTML = "";
    modalEl.removeEventListener("hidden.bs.modal", onHide);
  });

  window.ultimoMermaidCode = diagrama;

  if (show) {
    modal.show();
  }
}

function sanitizarTextoMermaid(texto) {
  return texto
    .replace(/"/g, "'")
    .replace(/\n/g, " ")
    .replace(/→/g, "->")
    .replace(/•/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/:\s*<br\/?>/g, " —<br/>")
    .replace(/-<br\/>>/g, "→")                        // resolve setas com br
    .replace(/<br\/>\s*"\]/g, '"]')                   // limpa <br/> no final
    .replace(/^(\d+)\./, "$1 -")                      // evita listas markdown
    .replace(/<br>/g, "<br/>")
    .replace(/(.{40})/g, "$1<br/>")
    .trim();
}

function abrirNoKroki() {
  const mermaidCode = window.ultimoMermaidCode?.trim();
  if (!mermaidCode) return alert("Gere o fluxograma primeiro.");

  const compressed = pako.deflate(mermaidCode, { level: 9 });
  const encoded = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `https://kroki.io/mermaid/svg/${encoded}`;
}

document.getElementById("incluirFluxograma").addEventListener("change", function () {
  localStorage.setItem("incluirFluxograma", this.checked);
});

function abrirModalComentarios(index = null) {
  comentarioEditandoIndex = index;

  document.getElementById("comentarioTexto").value =
    index !== null ? comentariosAtencao[index] : "";

  const modal = new bootstrap.Modal(document.getElementById("modalComentario"));
  modal.show();
}

function salvarComentario() {
  const texto = document.getElementById("comentarioTexto").value.trim();
  if (!texto) return;

  if (comentarioEditandoIndex !== null) {
    comentariosAtencao[comentarioEditandoIndex] = texto;
    comentarioEditandoIndex = null;
  } else {
    comentariosAtencao.push(texto);
  }

  renderizarComentariosPreview();
  bootstrap.Modal.getInstance(document.getElementById("modalComentario")).hide();

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Comentário salvo!',
    timer: 1500,
    showConfirmButton: false
  });
}

function renderizarComentariosPreview() {
  const container = document.getElementById("previewComentarios");
  const tituloWrapper = document.getElementById("comentarioTituloWrapper");

  container.innerHTML = '';

  if (comentariosAtencao.length === 0) {
    tituloWrapper.style.display = 'none';
    return;
  }

  tituloWrapper.style.display = 'block';

  comentariosAtencao.forEach((coment, i) => {
    const div = document.createElement('div');
    div.className = 'alert shadow-sm comentario-bloco d-flex justify-content-between align-items-start';
  
    div.innerHTML = `
      <div><i class="fas fa-exclamation-triangle me-2"></i>${coment}</div>
      <div class="ms-3 d-flex gap-1">
        <button class="btn btn-sm btn-secondary-light" title="Editar" onclick="abrirModalComentarios(${i})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-delete-prep" title="Excluir" onclick="removerComentario(${i})">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  
    container.appendChild(div);
  });
}

function removerComentario(index) {
  Swal.fire({
    icon: 'question',
    title: 'Remover comentário?',
    text: 'Essa ação não poderá ser desfeita.',
    showCancelButton: true,
    confirmButtonText: 'Sim, remover',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      comentariosAtencao.splice(index, 1);
      renderizarComentariosPreview();
      Swal.fire({
        toast: true,
        icon: 'success',
        title: 'Comentário removido!',
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}
