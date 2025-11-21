
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
                padding: 40px !important;
              }
              
              /* Ocultar elementos específicos na impressão */
              .no-print {
                display: none !important;
              }

              /* Forçar visibilidade do cabeçalho de impressão */
              .print-header {
                display: block !important;
                margin-bottom: 30px;
                text-align: center;
                border-bottom: 3px solid #000;
                padding-bottom: 20px;
              }

              .print-footer {
                display: block !important;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 10px;
                color: #666;
              }
              
              /* Resetar cores escuras para preto no papel */
              * {
                color: black !important;
                background-color: transparent !important;
                text-shadow: none !important;
                box-shadow: none !important;
                animation: none !important;
                transition: none !important;
                border-color: #ddd !important;
              }

              /* Layouts Específicos para Impressão */
              .print-grid-2 {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 20px !important;
              }
              
              .print-box {
                border: 1px solid #ccc !important;
                padding: 15px !important;
                border-radius: 8px !important;
                margin-bottom: 20px !important;
              }

              h3 {
                font-size: 18px !important;
                text-transform: uppercase !important;
                font-weight: bold !important;
                border-bottom: 2px solid #eee !important;
                margin-bottom: 15px !important;
                padding-bottom: 5px !important;
              }
              
              .label-text {
                font-size: 10px !important;
                text-transform: uppercase !important;
                color: #666 !important;
                display: block !important;
              }
              
              .value-text {
                font-size: 14px !important;
                font-weight: bold !important;
                display: block !important;
                margin-bottom: 10px !important;
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
        setTimeout(() => document.body.removeChild(iframe), 5000);
      }, 1000);
    }
  };

  const handleCopy = () => {
    const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('pt-BR') : '-';
    
    const text = `
FICHA TÉCNICA - SOLARTEKPRO
CLIENTE: ${cliente.nome}
--------------------------------
CPF/CNPJ: ${cliente.cpf}
CONTATO: ${cliente.telefone} | ${cliente.email || ''}
ENDEREÇO: ${cliente.logradouro}, ${cliente.numero} - ${cliente.bairro}, ${cliente.cidade}
REFERÊNCIA: ${cliente.ponto_referencia || '-'}

DADOS TÉCNICOS
UC: ${cliente.unidade_consumidora}
CONCESSIONÁRIA: ${cliente.concessionaria}
DISJUNTOR: ${cliente.disjuntor_padrao}
SISTEMA: ${cliente.tipo_sistema}

COORDENADAS
UTM N: ${cliente.utm_norte || '-'} | E: ${cliente.utm_leste || '-'} | Z: ${cliente.utm_zona || '-'}

STATUS: ${cliente.status}
TEMPO DE PROJETO: ${cliente.tempo_projeto || 0}h
    `.trim();
    
    navigator.clipboard.writeText(text);
    alert("✅ Dados copiados!");
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
        const base64 = anexo.dados.includes(',') ? anexo.dados.split(',')[1] : anexo.dados;
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } catch (e) {
        alert("Erro ao abrir PDF. Tente baixar o arquivo.");
      }
    } else if (anexo.tipo.startsWith('image/')) {
      setPreviewData({ data: anexo.dados, type: 'image' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Construir endereço completo
  const fullAddress = `${cliente.logradouro || ''}, ${cliente.numero || ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''} - CEP: ${cliente.cep || ''}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;

  // Componentes de UI Reutilizáveis
  const InfoCard = ({ label, value, icon, highlight = false }: any) => (
    <div className={`p-4 rounded-xl border transition-all ${highlight ? 'bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-900/20' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center gap-1">
        {icon && <span>{icon}</span>} {label}
      </p>
      <p className={`text-base md:text-lg font-bold truncate ${highlight ? 'text-blue-200' : 'text-slate-200'}`}>
        {value || '-'}
      </p>
    </div>
  );

  const renderAttachmentList = (title: string, status: string, anexos: Anexo[]) => (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex flex-col h-full print-box">
      <div className="flex justify-between items-center mb-3 border-b border-slate-700/50 pb-2">
        <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">{title}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
          status === 'Aprovado' ? 'bg-green-500/20 text-green-400' : 
          status === 'Rejeitado' ? 'bg-red-500/20 text-red-400' : 
          status === 'Recebido' ? 'bg-blue-500/20 text-blue-400' :
          'bg-slate-700 text-slate-400'
        }`}>
          {status}
        </span>
      </div>
      
      <div className="space-y-2 flex-grow">
        {(!anexos || anexos.length === 0) ? (
          <p className="text-xs text-slate-500 italic py-2 text-center">Nenhum arquivo anexado.</p>
        ) : (
          anexos.map((anexo) => (
            <div key={anexo.id} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50 hover:border-blue-500/30 transition-colors group">
              <div 
                className="flex items-center gap-2 overflow-hidden cursor-pointer flex-grow" 
                onClick={() => handlePreview(anexo)}
                title="Clique para visualizar"
              >
                <span className="text-lg flex-shrink-0">{anexo.tipo.includes('pdf') ? '📄' : '🖼️'}</span>
                <span className="text-xs text-slate-300 truncate group-hover:text-blue-300 transition-colors">{anexo.nome}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); downloadAnexo(anexo); }}
                className="text-slate-500 hover:text-white transition-colors p-1 flex-shrink-0 ml-2"
                title="Baixar"
              >
                ⬇️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        
        {/* MODAL PRINCIPAL */}
        <div className="bg-[#0b1221] w-full h-full md:h-[95vh] md:max-w-6xl md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border border-slate-800">
            
            {/* CABEÇALHO FIXO */}
            <div className="flex-shrink-0 bg-slate-900/95 border-b border-slate-800 p-4 md:p-6 flex justify-between items-center z-30 shadow-lg">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-green-500 p-[2px] shadow-lg shadow-blue-500/20">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{cliente.nome}</h2>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 font-mono">
                        <span>{cliente.cpf}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span className={`font-bold ${cliente.status === 'Concluído' ? 'text-green-400' : 'text-blue-400'}`}>{cliente.status}</span>
                    </div>
                  </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3">
                  <button onClick={handleCopy} className="hidden md:flex px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all text-xs font-bold uppercase tracking-wide items-center gap-2">
                    📋 <span className="hidden lg:inline">Copiar Dados</span>
                  </button>
                  <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                    🖨️ <span className="hidden md:inline">Imprimir</span>
                  </button>
                  <div className="h-8 w-px bg-slate-700 mx-1"></div>
                  <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-500/50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
            </div>
            
            {/* CONTEÚDO ROLÁVEL */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 md:p-8 bg-[#0b1221]">
                <div ref={printRef} className="max-w-5xl mx-auto space-y-8 pb-64"> {/* PB-64 GARANTE ESPAÇO EXTRA NO FINAL */}
                
                    {/* HEADER APENAS PARA IMPRESSÃO */}
                    <div className="hidden print-header">
                        <h1 style={{fontSize: '24px', fontWeight: 'bold'}}>SolarTekPro Energias Renováveis</h1>
                        <p>Ficha Cadastral do Cliente</p>
                    </div>

                    {/* BLOCO 1: VISÃO GERAL E DADOS TÉCNICOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Coluna Esquerda: Contato */}
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-slate-700"></span> Contato
                            </h3>
                            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Telefone</label>
                                    <p className="text-lg text-white font-mono">{cliente.telefone}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Email</label>
                                    <p className="text-base text-white break-all">{cliente.email || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita: Instalação (Cards) */}
                        <div className="lg:col-span-2">
                            <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-green-900"></span> Dados Técnicos da Instalação
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <InfoCard label="Unidade Consumidora" value={cliente.unidade_consumidora} icon="⚡" highlight />
                                <InfoCard label="Concessionária" value={cliente.concessionaria} />
                                <InfoCard label="Disjuntor" value={cliente.disjuntor_padrao} />
                                <InfoCard label="Tipo de Sistema" value={cliente.tipo_sistema} />
                            </div>
                        </div>
                    </div>

                    {/* BLOCO 2: LOCALIZAÇÃO MASTER (MAPA + COORDENADAS) */}
                    <section className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-xl"></div>
                        <div className="relative bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
                            
                            {/* Barra de Título do Endereço */}
                            <div className="bg-slate-800/80 backdrop-blur px-6 py-4 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        📍 {fullAddress}
                                    </h3>
                                    {cliente.ponto_referencia && <p className="text-xs text-slate-400 mt-1">Ref: {cliente.ponto_referencia}</p>}
                                </div>
                            </div>

                            {/* MAPA */}
                            <div className="h-[300px] w-full bg-slate-950 relative no-print">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'grayscale(20%) contrast(1.2) opacity(0.9)' }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${encodedAddress}&output=embed`}
                                ></iframe>
                                {/* Overlay Gradient para integrar mapa ao tema */}
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(2,6,23,0.8)]"></div>
                            </div>

                            {/* BARRA DE FERRAMENTAS DE LOCALIZAÇÃO (Abaixo do Mapa) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700 bg-slate-800/50">
                                
                                {/* Lado Esquerdo: Botões de Navegação */}
                                <div className="p-4 flex items-center justify-center gap-4 no-print">
                                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg shadow-blue-900/20">
                                        Google Maps ↗
                                    </a>
                                    <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg shadow-cyan-900/20">
                                        Waze ↗
                                    </a>
                                </div>

                                {/* Lado Direito: Coordenadas Técnicas */}
                                <div className="p-4 flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 text-center md:text-left">Coordenadas de Instalação (UTM)</p>
                                    <div className="flex justify-around md:justify-between items-center gap-2">
                                        <div className="text-center md:text-left">
                                            <span className="block text-[10px] text-slate-400">NORTE</span>
                                            <span className="block text-sm font-mono text-green-400 font-bold">{cliente.utm_norte || '--'}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-700"></div>
                                        <div className="text-center md:text-left">
                                            <span className="block text-[10px] text-slate-400">LESTE</span>
                                            <span className="block text-sm font-mono text-green-400 font-bold">{cliente.utm_leste || '--'}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-700"></div>
                                        <div className="text-center md:text-left">
                                            <span className="block text-[10px] text-slate-400">ZONA</span>
                                            <span className="block text-sm font-mono text-white font-bold">{cliente.utm_zona || '--'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* BLOCO 3: CRONOGRAMA */}
                    <section className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-8 h-[2px] bg-purple-900"></span> Datas Importantes
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Entrada</p>
                                <p className="text-sm text-white font-bold">{formatDate(cliente.data_entrada_homologacao)}</p>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Resposta</p>
                                <p className="text-sm text-white font-bold">{formatDate(cliente.data_resposta_concessionaria)}</p>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Vistoria</p>
                                <p className="text-sm text-white font-bold">{formatDate(cliente.data_vistoria)}</p>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Tempo Gasto</p>
                                <p className="text-sm text-white font-bold">{cliente.tempo_projeto || 0}h</p>
                            </div>
                        </div>
                    </section>

                    {/* BLOCO 4: DOCUMENTOS */}
                    <section>
                        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-8 h-[2px] bg-yellow-900"></span> Documentação
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-grid-2">
                            {renderAttachmentList('RG/CNH', cliente.doc_identificacao_status, cliente.anexos_identificacao)}
                            {renderAttachmentList('Conta Energia', cliente.conta_energia_status, cliente.anexos_conta)}
                            {renderAttachmentList('Procuração', cliente.procuracao_status, cliente.anexos_procuracao)}
                            {renderAttachmentList('Outros', cliente.outras_imagens_status, cliente.anexos_outras_imagens)}
                        </div>
                    </section>

                    {/* Footer Print */}
                    <div className="hidden print-footer">
                        <p>Relatório do Sistema SolarTekPro - {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Modal de Zoom de Imagem */}
      {previewData && previewData.type === 'image' && (
        <div 
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in"
          onClick={() => setPreviewData(null)}
        >
          <div className="relative max-w-[98vw] max-h-[98vh]">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-red-400 text-sm font-bold bg-slate-800 px-4 py-2 rounded-full border border-slate-700 transition-colors"
              onClick={() => setPreviewData(null)}
            >
              FECHAR ✕
            </button>
            <img 
              src={previewData.data} 
              alt="Zoom" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
