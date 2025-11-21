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
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
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
              
              @page {
                margin: 0;
                size: auto;
              }

              html, body {
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
              }

              body {
                font-family: 'Inter', sans-serif;
                background-color: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                padding: 20px !important;
              }
              
              /* Ocultar elementos específicos na impressão */
              .no-print {
                display: none !important;
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
              
              /* Resetar cores escuras para preto no papel */
              * {
                color: black !important;
                text-shadow: none !important;
                box-shadow: none !important;
                animation: none !important;
                transition: none !important;
              }

              /* Bordas e Fundos */
              .border {
                border-color: #ccc !important;
                border-width: 1px !important;
              }
              
              div {
                background-color: transparent !important;
              }

              /* Layout Grid */
              .grid {
                display: grid !important;
              }
              
              /* Ajustes de Texto */
              h3 {
                border-bottom: 1px solid #000 !important;
                margin-top: 20px !important;
                margin-bottom: 10px !important;
                font-size: 16px !important;
                text-transform: uppercase !important;
                font-weight: bold !important;
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
        // Remover iframe após impressão (opcional)
        setTimeout(() => document.body.removeChild(iframe), 5000);
      }, 1000);
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
        
        // Limpar a URL depois de um tempo para não vazar memória
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
    <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/50 hover:border-blue-500/30 transition-colors break-inside-avoid">
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

  // Construir endereço completo para os links e mapa
  const fullAddress = `${cliente.logradouro || ''}, ${cliente.numero || ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  // URLs de navegação
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
        
        {/* Modal Container - Altura controlada e Scroll interno */}
        <div 
          className="bg-slate-900 border border-white/10 w-full h-full md:h-auto md:max-h-[95vh] md:max-w-5xl md:rounded-2xl shadow-2xl flex flex-col relative"
        >
            
            {/* Header FIXO - Não rola */}
            <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 md:px-6 py-4 flex justify-between items-center z-20 rounded-t-2xl">
              <div className="flex items-center gap-3">
                  <div className="bg-blue-600/20 p-2 rounded-full hidden md:block">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-black text-white leading-none tracking-tight">
                        Detalhes do Cliente
                    </h2>
                    <p className="text-xs text-blue-300 font-mono mt-1">{cliente.nome}</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <button onClick={handleCopy} className="hidden md:flex px-4 py-2 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-bold uppercase tracking-wide items-center gap-2">
                    📋 Copiar
                  </button>
                  <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 shadow-lg shadow-green-600/20 transition-all text-xs font-bold uppercase tracking-wide flex items-center gap-2 transform active:scale-95">
                    🖨️ <span className="hidden md:inline">Imprimir / PDF</span>
                  </button>
                  <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-slate-700 ml-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
            </div>
            
            {/* Content Scrollable - Apenas esta área rola */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-8 bg-slate-900">
                <div ref={printRef} className="space-y-8">
                
                    {/* Header for Print Only */}
                    <div className="hidden print-header text-center mb-8 border-b-2 border-gray-800 pb-4 pt-4">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <div style={{fontSize: '24px', fontWeight: 'bold'}}>SolarTekPro</div>
                        </div>
                        <p className="text-sm text-gray-600 uppercase tracking-[0.3em]">Energias Renováveis</p>
                        <h2 className="text-xl mt-6 font-bold border px-4 py-1 inline-block rounded bg-gray-100">Ficha Cadastral do Cliente</h2>
                    </div>

                    {/* Section 1: Personal */}
                    <section>
                        <h3 className="text-lg font-black text-green-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-700 pb-3">
                            <span className="text-xl">📋</span> Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">Nome Completo</span><span className="font-bold text-white text-xl block bg-slate-800/50 p-2 rounded border border-slate-700/50">{cliente.nome}</span></div>
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">CPF/CNPJ</span><span className="font-medium text-slate-200 font-mono text-xl block bg-slate-800/50 p-2 rounded border border-slate-700/50">{cliente.cpf}</span></div>
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">Telefone</span><span className="font-medium text-slate-200 text-xl block bg-slate-800/50 p-2 rounded border border-slate-700/50">{cliente.telefone}</span></div>
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">Email</span><span className="font-medium text-slate-200 text-xl block bg-slate-800/50 p-2 rounded border border-slate-700/50 truncate">{cliente.email || '-'}</span></div>
                            
                            <div className="md:col-span-2 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                                <div className="relative z-10">
                                    <span className="text-xs text-green-400 block uppercase font-bold mb-2 tracking-wide">Localização</span>
                                    <span className="font-bold text-white block text-xl md:text-2xl leading-tight mb-1">
                                    {fullAddress}
                                    </span>
                                    <span className="text-slate-400 block text-base mb-3">
                                    CEP: {cliente.cep}
                                    </span>
                                    {cliente.ponto_referencia && (
                                    <span className="block mt-2 text-sm text-blue-300 italic border-t border-slate-700/50 pt-2">
                                        <span className="font-bold not-italic text-slate-400">Referência:</span> {cliente.ponto_referencia}
                                    </span>
                                    )}
                                    
                                    {/* GOOGLE MAPS EMBED - VISUAL */}
                                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-700 h-48 w-full no-print">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            allowFullScreen
                                            src={`https://maps.google.com/maps?q=${encodedAddress}&output=embed`}
                                        ></iframe>
                                    </div>

                                    {/* NAVIGATION BUTTONS */}
                                    <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4 no-print">
                                        <a 
                                            href={mapsUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg hover:shadow-blue-600/30 font-bold text-sm uppercase tracking-wide group"
                                        >
                                            <svg className="w-5 h-5 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                            Abrir no Maps
                                        </a>
                                        <a 
                                            href={wazeUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30 font-bold text-sm uppercase tracking-wide group"
                                        >
                                            <svg className="w-5 h-5 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24"><path d="M18.5 6C17 6 16 7.5 16 8C16 8.5 15.5 9 15 9C14.5 9 14 8.5 14 8C14 6 13 4 11 4C8 4 6 6 6 9C6 10.5 6.5 11.5 7.5 12.5C7.5 12.5 7 15 9 17C10 18 12 18 14 17C15.5 16.5 16.5 15.5 17 14.5C18.5 14.5 19.5 13.5 20.5 12.5C22 11 22.5 9 21.5 7.5C20.5 6 18.5 6 18.5 6ZM9.5 10C8.7 10 8 9.3 8 8.5C8 7.7 8.7 7 9.5 7C10.3 7 11 7.7 11 8.5C11 9.3 10.3 10 9.5 10ZM15.5 10C14.7 10 14 9.3 14 8.5C14 7.7 14.7 7 15.5 7C16.3 7 17 7.7 17 8.5C17 9.3 16.3 10 15.5 10Z"/></svg>
                                            Abrir no Waze
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Technical */}
                    <section>
                        <h3 className="text-lg font-black text-green-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-700 pb-3">
                            <span className="text-xl">⚡</span> Dados da Instalação
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-blue-900/10 rounded-2xl border border-blue-500/20">
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">UC</span><span className="font-black text-white font-mono text-xl">{cliente.unidade_consumidora}</span></div>
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">Concessionária</span><span className="font-bold text-white text-lg">{cliente.concessionaria}</span></div>
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">Disjuntor</span><span className="font-bold text-white text-lg">{cliente.disjuntor_padrao}</span></div>
                            <div><span className="text-xs text-blue-300 block uppercase font-bold mb-1 tracking-wide">Sistema</span><span className="font-bold text-white text-lg">{cliente.tipo_sistema}</span></div>
                        </div>
                    </section>

                    {/* Section 3: Project Status */}
                    <section>
                        <h3 className="text-lg font-black text-green-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-700 pb-3">
                            <span className="text-xl">🚀</span> Status do Projeto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <span className="text-xs text-blue-300 block uppercase font-bold mb-1">Status Atual</span>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-base font-bold mt-1 border ${
                                cliente.status === 'Concluído' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}>
                                {cliente.status}
                                </span>
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <span className="text-xs text-blue-300 block uppercase font-bold mb-1">Tempo Gasto</span>
                                <span className="font-black text-white text-2xl">{cliente.tempo_projeto} <span className="text-sm text-slate-400 font-normal">horas</span></span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-colors">
                                <span className="text-xs text-slate-400 block uppercase mb-1 font-bold">Entrada Homologação</span>
                                <span className="font-bold text-white text-lg">{formatDate(cliente.data_entrada_homologacao)}</span>
                            </div>
                            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-colors">
                                <span className="text-xs text-slate-400 block uppercase mb-1 font-bold">Resposta Concessionária</span>
                                <span className="font-bold text-white text-lg">{formatDate(cliente.data_resposta_concessionaria)}</span>
                            </div>
                            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-colors">
                                <span className="text-xs text-slate-400 block uppercase mb-1 font-bold">Data Vistoria</span>
                                <span className="font-bold text-white text-lg">{formatDate(cliente.data_vistoria)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Docs & Attachments */}
                    <section>
                        <h3 className="text-lg font-black text-green-400 uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-700 pb-3">
                            <span className="text-xl">📂</span> Documentos & Anexos
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