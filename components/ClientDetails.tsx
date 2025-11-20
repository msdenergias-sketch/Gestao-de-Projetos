
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Anexo } from '../types';

interface ClientDetailsProps {
  cliente: Cliente;
  onClose: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ cliente, onClose }) => {
  const [previewData, setPreviewData] = useState<{data: string, type: 'image'} | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Referência para o conteúdo que será impresso
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    if (!printRef.current) return;

    // 1. Criar um iframe invisível
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // 2. Obter o conteúdo HTML
    const content = printRef.current.innerHTML;

    // 3. Escrever o documento no iframe com estilos forçados para impressão
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Ficha do Cliente - ${cliente.nome}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              body {
                font-family: 'Inter', sans-serif;
                background-color: white !important;
                color: black !important;
                margin: 0;
                padding: 20px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Forçar visibilidade do cabeçalho de impressão */
              .print-header {
                display: block !important;
                margin-bottom: 20px;
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
              }

              .print-footer {
                display: block !important;
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 10px;
                color: #666;
              }
              
              /* Esconder botões e elementos não imprimíveis */
              .no-print, button {
                display: none !important;
              }

              /* Resetar cores escuras para preto no papel */
              .text-white, .text-slate-200, .text-slate-300, .text-slate-400, .text-blue-100, .text-blue-200, .text-blue-300, .text-blue-400, .text-green-300, .text-green-400, .text-yellow-300, .text-cyan-300 {
                color: black !important;
              }

              .text-slate-500, .text-slate-400 {
                color: #333 !important;
              }

              /* Bordas e Fundos */
              .border, .border-slate-700, .border-white\\/10, .border-blue-500\\/20 {
                border-color: #ccc !important;
                border-width: 1px !important;
              }
              
              .bg-slate-800\\/50, .bg-slate-900\\/50, .bg-blue-900\\/20 {
                background-color: transparent !important;
              }

              /* Layout Grid */
              .grid {
                display: grid !important;
              }
              
              /* Ajustes de Texto */
              h3 {
                border-bottom: 1px solid #000 !important;
                color: #000 !important;
                margin-top: 20px !important;
                margin-bottom: 10px !important;
                font-size: 16px !important;
                text-transform: uppercase !important;
              }

              /* Imagens */
              img {
                max-width: 100%;
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      doc.close();

      // 4. Aguardar carregamento e imprimir
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remover iframe após impressão (opcional, mas bom para limpeza)
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 800);
    }
  };

  const handleCopy = () => {
    const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('pt-BR') : 'Pendente';
    
    const text = `
*SOLARTEKPRO - FICHA DO CLIENTE*
--------------------------------
*DADOS PESSOAIS*
Nome: ${cliente.nome}
CPF/CNPJ: ${cliente.cpf}
Telefone: ${cliente.telefone}
Email: ${cliente.email || 'Não informado'}
Endereço: ${cliente.logradouro}, ${cliente.numero} ${cliente.complemento ? `- ${cliente.complemento}` : ''}
Bairro: ${cliente.bairro} | Cidade: ${cliente.cidade} - ${cliente.cep}
Ponto de Referência: ${cliente.ponto_referencia || '-'}

*DADOS TÉCNICOS*
UC: ${cliente.unidade_consumidora}
Concessionária: ${cliente.concessionaria}
Disjuntor: ${cliente.disjuntor_padrao}
Sistema: ${cliente.tipo_sistema}

*STATUS DO PROJETO*
Status Atual: ${cliente.status}
Tempo de Projeto: ${cliente.tempo_projeto || 0} horas
Entrada Homologação: ${formatDate(cliente.data_entrada_homologacao)}
Resposta Concessionária: ${formatDate(cliente.data_resposta_concessionaria)}
Vistoria: ${formatDate(cliente.data_vistoria)}

*DOCUMENTAÇÃO*
RG/CNH: ${cliente.doc_identificacao_status}
Conta Energia: ${cliente.conta_energia_status}
Procuração: ${cliente.procuracao_status}
    `.trim();
    
    navigator.clipboard.writeText(text);
    alert("✅ Dados copiados para a área de transferência!");
  };

  const downloadAnexo = (anexo: Anexo) => {
    const link = document.createElement('a');
    link.href = anexo.dados;
    link.download = anexo.nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (anexo: Anexo) => {
    if (anexo.tipo === 'application/pdf') {
      try {
        // Solução Robusta para PDF: Blob URL em Nova Aba
        const base64 = anexo.dados.includes(',') ? anexo.dados.split(',')[1] : anexo.dados;
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Abre em nova aba para usar o visualizador nativo (funciona em mobile/pc)
        window.open(blobUrl, '_blank');
        
        // Limpar a URL depois de um tempo para não vazar memória, mas dando tempo de abrir
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        
      } catch (e) {
        console.error("Erro ao abrir PDF", e);
        alert("Erro ao processar PDF. Tente baixar o arquivo.");
      }
    } else if (anexo.tipo.startsWith('image/')) {
      setPreviewData({ data: anexo.dados, type: 'image' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderAttachmentList = (title: string, status: string, anexos: Anexo[]) => (
    <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/50 hover:border-blue-500/30 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-blue-200 text-sm uppercase tracking-wider">{title}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
          status === 'Aprovado' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
          status === 'Recebido' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
          'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
        }`}>
          {status}
        </span>
      </div>
      
      {anexos && anexos.length > 0 ? (
        <div className="space-y-2">
          {anexos.map((anexo) => {
            const isImage = anexo.tipo.startsWith('image/');
            const isPdf = anexo.tipo === 'application/pdf';
            const canPreview = isImage || isPdf;

            return (
              <div key={anexo.id} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:bg-slate-700/50 transition-colors">
                {/* Preview / Icon */}
                <div 
                  className={`w-10 h-10 flex-shrink-0 bg-slate-800 rounded overflow-hidden flex items-center justify-center border border-slate-600 ${canPreview ? 'cursor-pointer hover:border-blue-400' : ''}`}
                  onClick={() => canPreview && handlePreview(anexo)}
                >
                  {isImage ? (
                    <img src={anexo.dados} alt="Preview" className="w-full h-full object-cover" />
                  ) : isPdf ? (
                    <span className="text-xl text-red-400">📄</span>
                  ) : (
                    <span className="text-xl text-slate-400">📎</span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-white truncate" title={anexo.nome}>{anexo.nome}</p>
                  <p className="text-xs text-slate-400">{(anexo.tamanho / 1024).toFixed(1)} KB</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 no-print">
                  {canPreview && (
                    <button 
                      onClick={() => handlePreview(anexo)}
                      className="px-3 py-1.5 text-xs bg-slate-700 text-blue-200 font-bold rounded hover:bg-white hover:text-black transition-colors flex items-center justify-center"
                      title={isPdf ? "Visualizar PDF" : "Visualizar Imagem"}
                    >
                      👁️
                    </button>
                  )}
                  <button 
                    onClick={() => downloadAnexo(anexo)}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition-colors flex items-center justify-center"
                    title="Baixar Arquivo"
                  >
                    ⬇
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic text-center py-2">Nenhum arquivo anexado.</p>
      )}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-0 md:p-4 h-full">
        
        {/* Modal Content */}
        <div 
          className="bg-slate-900 border border-white/10 md:rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto flex flex-col"
        >
            
            {/* Header with Actions */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 md:px-6 py-4 flex justify-between items-center z-10 flex-shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  👤 Detalhes do Cliente
              </h2>
              <div className="flex space-x-2">
                  <button onClick={handleCopy} className="hidden md:flex px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-bold uppercase tracking-wide items-center gap-2">
                    📋 Copiar
                  </button>
                  <button onClick={handlePrint} className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                    🖨️ <span className="hidden md:inline">Imprimir / PDF</span>
                  </button>
                  <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                    ✕
                  </button>
              </div>
            </div>
            
            {/* Printable Content Container (ref for printing) */}
            <div ref={printRef} className="p-4 md:p-8 space-y-6 md:space-y-8 flex-grow">
              
              {/* Header for Print Only (Hidden on Screen via className logic, shown via iframe style) */}
              <div className="hidden print-header text-center mb-8 border-b-2 border-gray-800 pb-4 pt-4">
                  <div className="flex items-center justify-center gap-4 mb-2">
                      <div style={{fontSize: '24px', fontWeight: 'bold'}}>SolarTekPro</div>
                  </div>
                  <p className="text-sm text-gray-600 uppercase tracking-[0.3em]">Energias Renováveis</p>
                  <h2 className="text-xl mt-6 font-bold border px-4 py-1 inline-block rounded bg-gray-100">Ficha Cadastral do Cliente</h2>
              </div>

              {/* Section 1: Personal */}
              <section>
                  <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-base">
                    <div><span className="text-sm text-blue-200/70 block uppercase font-semibold mb-1">Nome Completo</span><span className="font-bold text-white text-lg">{cliente.nome}</span></div>
                    <div><span className="text-sm text-blue-200/70 block uppercase font-semibold mb-1">CPF/CNPJ</span><span className="font-medium text-slate-200 font-mono text-lg">{cliente.cpf}</span></div>
                    <div><span className="text-sm text-blue-200/70 block uppercase font-semibold mb-1">Telefone</span><span className="font-medium text-slate-200 text-lg">{cliente.telefone}</span></div>
                    <div><span className="text-sm text-blue-200/70 block uppercase font-semibold mb-1">Email</span><span className="font-medium text-slate-200 text-lg">{cliente.email || '-'}</span></div>
                    <div className="md:col-span-2 bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                        <span className="text-sm text-blue-200/70 block uppercase font-semibold mb-1">Endereço Completo</span>
                        <span className="font-bold text-white block text-lg">
                          {cliente.logradouro}, {cliente.numero} {cliente.complemento ? `- ${cliente.complemento}` : ''}
                        </span>
                        <span className="text-slate-300 block text-base mt-1">
                          {cliente.bairro} - {cliente.cidade} / CEP: {cliente.cep}
                        </span>
                        {cliente.ponto_referencia && (
                          <span className="block mt-3 text-sm text-green-300 italic border-t border-slate-700 pt-2">
                              Ref: {cliente.ponto_referencia}
                          </span>
                        )}
                    </div>
                  </div>
              </section>

              {/* Section 2: Technical */}
              <section className="mt-10">
                  <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                    Dados da Instalação
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-blue-900/20 rounded-xl border border-blue-500/20">
                    <div><span className="text-xs text-blue-300 block uppercase font-semibold mb-1">UC</span><span className="font-bold text-white font-mono text-xl">{cliente.unidade_consumidora}</span></div>
                    <div><span className="text-xs text-blue-300 block uppercase font-semibold mb-1">Concessionária</span><span className="font-bold text-white text-lg">{cliente.concessionaria}</span></div>
                    <div><span className="text-xs text-blue-300 block uppercase font-semibold mb-1">Disjuntor</span><span className="font-bold text-white text-lg">{cliente.disjuntor_padrao}</span></div>
                    <div><span className="text-xs text-blue-300 block uppercase font-semibold mb-1">Sistema</span><span className="font-bold text-white text-lg">{cliente.tipo_sistema}</span></div>
                  </div>
              </section>

              {/* Section 3: Project Status */}
              <section className="mt-10">
                  <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                    Status do Projeto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-sm text-blue-200/70 block uppercase font-semibold mb-1">Status Atual</span>
                        <span className={`inline-block px-5 py-2 rounded-full text-base font-bold mt-1 border ${
                          cliente.status === 'Concluído' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {cliente.status}
                        </span>
                    </div>
                    <div>
                        <span className="text-sm text-blue-200/70 block uppercase font-semibold mb-1">Tempo Gasto</span>
                        <span className="font-bold text-white text-lg">{cliente.tempo_projeto} horas</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-400 block uppercase mb-1">Entrada Homologação</span>
                        <span className="font-bold text-white text-lg">{formatDate(cliente.data_entrada_homologacao)}</span>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-400 block uppercase mb-1">Resposta Concessionária</span>
                        <span className="font-bold text-white text-lg">{formatDate(cliente.data_resposta_concessionaria)}</span>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-400 block uppercase mb-1">Data Vistoria</span>
                        <span className="font-bold text-white text-lg">{formatDate(cliente.data_vistoria)}</span>
                    </div>
                  </div>
              </section>

              {/* Section 4: Docs & Attachments */}
              <section className="mt-10">
                  <h3 className="text-base font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                    Documentos & Anexos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderAttachmentList('RG/CNH', cliente.doc_identificacao_status, cliente.anexos_identificacao)}
                      {renderAttachmentList('Conta Energia', cliente.conta_energia_status, cliente.anexos_conta)}
                      {renderAttachmentList('Procuração', cliente.procuracao_status, cliente.anexos_procuracao)}
                      {renderAttachmentList('Outros', cliente.outras_imagens_status, cliente.anexos_outras_imagens)}
                  </div>
              </section>

              {/* Footer Print */}
              <div className="hidden print-footer mt-8 pt-8 border-t text-center text-xs text-gray-400">
                  <p>Relatório gerado pelo Sistema de Gestão SolarTekPro em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
            </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {previewData && previewData.type === 'image' && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setPreviewData(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <button 
              className="absolute -top-8 -right-4 text-white hover:text-red-400 text-3xl font-bold transition-colors z-50"
              onClick={() => setPreviewData(null)}
            >
              &times;
            </button>
            <img 
              src={previewData.data} 
              alt="Visualização em tela cheia" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
