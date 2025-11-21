
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Anexo } from '../types';

interface ClientDetailsProps {
  cliente: Cliente;
  onClose: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ cliente, onClose }) => {
  const [previewData, setPreviewData] = useState<{data: string, type: 'image'} | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Bloqueia scroll do fundo e esconde rodapé principal via CSS global
    document.body.style.overflow = 'hidden';
    
    const style = document.createElement('style');
    style.innerHTML = `
      body > div > footer { display: none !important; } 
      @media print {
        body { background: white !important; color: black !important; margin: 0 !important; }
        body * { visibility: hidden; }
        #print-content, #print-content * {
          visibility: visible;
          color: black !important;
        }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
          background: white !important;
        }
        .no-print { display: none !important; }
        .print-box { border: 1px solid #ccc !important; box-shadow: none !important; background: white !important; }
        * { color: black !important; background-color: transparent !important; border-color: #ddd !important; text-shadow: none !important; box-shadow: none !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.overflow = 'auto';
      document.head.removeChild(style);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      const contentHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #000; background: #fff; width: 100%; box-sizing: border-box;">
          
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">Ficha Técnica do Cliente</h1>
            <p style="margin: 5px 0; font-size: 14px; color: #444;">SolarTekPro Energias Renováveis</p>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd;">
            <div>
                <p style="font-size: 10px; text-transform: uppercase; color: #666;">Cliente</p>
                <p style="font-size: 18px; font-weight: bold; margin: 0;">${cliente.nome}</p>
            </div>
            <div style="text-align: right;">
                <p style="font-size: 10px; text-transform: uppercase; color: #666;">CPF/CNPJ</p>
                <p style="font-size: 16px; font-weight: bold; margin: 0;">${cliente.cpf}</p>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Contato & Endereço</h3>
            <table style="width: 100%; font-size: 12px;">
                <tr>
                    <td style="padding: 5px; width: 50%;"><strong>Telefone:</strong> ${cliente.telefone}</td>
                    <td style="padding: 5px; width: 50%;"><strong>Email:</strong> ${cliente.email || '-'}</td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 5px;"><strong>Endereço:</strong> ${cliente.logradouro}, ${cliente.numero} - ${cliente.bairro}</td>
                </tr>
                <tr>
                    <td style="padding: 5px;"><strong>Cidade:</strong> ${cliente.cidade} - CEP: ${cliente.cep}</td>
                    <td style="padding: 5px;"><strong>Ref:</strong> ${cliente.ponto_referencia || '-'}</td>
                </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Dados da Instalação</h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr style="background: #f0f0f0;">
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>UC (Unidade Consumidora)</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Concessionária</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Disjuntor</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tipo de Sistema</strong></td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${cliente.unidade_consumidora}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${cliente.concessionaria}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${cliente.disjuntor_padrao}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${cliente.tipo_sistema}</td>
                </tr>
            </table>
          </div>

          <div style="margin-top: 30px; font-size: 10px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
            Documento gerado automaticamente pelo Sistema de Gestão SolarTekPro.
          </div>
        </div>
      `;

      doc.open();
      doc.write(`<html><head><title>Imprimir Ficha</title></head><body style="margin:0; padding:0; background:white;" onload="window.print()">${contentHTML}</body></html>`);
      doc.close();

      setTimeout(() => document.body.removeChild(iframe), 2000);
    }
  };

  const handleCopy = () => {
    const fullAddress = `${cliente.logradouro || ''}, ${cliente.numero || ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    const text = `
*FICHA CLIENTE - SOLARTEKPRO*
👤 *${cliente.nome}*
📄 CPF: ${cliente.cpf}
📞 ${cliente.telefone}
📍 ${fullAddress}
🔗 Mapa: ${mapsLink}

⚡ *DADOS TÉCNICOS*
UC: ${cliente.unidade_consumidora} | Conc: ${cliente.concessionaria}
Sistema: ${cliente.tipo_sistema} | Disj: ${cliente.disjuntor_padrao}

🌐 *COORDENADAS UTM*
N: ${cliente.utm_norte || '-'} | E: ${cliente.utm_leste || '-'} | Z: ${cliente.utm_zona || '-'}
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
    try {
        const base64 = anexo.dados.includes(',') ? anexo.dados.split(',')[1] : anexo.dados;
        const contentType = anexo.tipo;
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: contentType });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
        alert("Erro ao visualizar. Tente baixar o arquivo.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const fullAddress = `${cliente.logradouro || ''}, ${cliente.numero || ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''} - CEP: ${cliente.cep || ''}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;

  // Widgets de Dados
  const TechWidget = ({ label, value, icon, color }: any) => (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-800/60 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-opacity-10 ${color === 'blue' ? 'bg-blue-500 text-blue-400' : color === 'green' ? 'bg-green-500 text-green-400' : 'bg-yellow-500 text-yellow-400'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">{label}</p>
        <p className="text-sm font-bold text-slate-200 truncate">{value || '-'}</p>
      </div>
    </div>
  );

  const DocCard = ({ title, status, anexos }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase">{title}</h4>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${status === 'Aprovado' ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{status}</span>
      </div>
      <div className="space-y-1.5">
        {anexos && anexos.length > 0 ? anexos.map((anexo: any) => (
          <div key={anexo.id} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 hover:border-slate-600 transition-all group">
            <div onClick={() => handlePreview(anexo)} className="flex items-center gap-2 cursor-pointer overflow-hidden">
              <span className="text-base">{anexo.tipo.includes('pdf') ? '📄' : '🖼️'}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[100px] group-hover:text-white">{anexo.nome}</span>
            </div>
            <div className="flex gap-1">
                <button onClick={(e) => {e.stopPropagation(); handlePreview(anexo)}} className="p-1 hover:text-blue-400 transition-colors text-slate-500">👁️</button>
                <button onClick={(e) => {e.stopPropagation(); downloadAnexo(anexo)}} className="p-1 hover:text-green-400 transition-colors text-slate-500">⬇️</button>
            </div>
          </div>
        )) : <div className="text-[10px] text-slate-600 italic text-center py-2">Sem anexos</div>}
      </div>
    </div>
  );

  return (
    /* ESTRUTURA MOBILE-FIRST COM CSS GRID */
    <div className="fixed inset-0 z-[9999] bg-[#050b14] grid grid-rows-[auto_1fr_auto] h-[100dvh] w-screen overflow-hidden">
      
      {/* 1. CABEÇALHO (Fixo no topo) */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-white/5 px-4 py-3 flex justify-between items-center z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm">👤</div>
          </div>
          <div className="leading-tight">
            <h2 className="text-base font-bold text-white max-w-[180px] truncate">{cliente.nome}</h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">{cliente.status}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="Copiar Dados">📋</button>
          <button onClick={handlePrint} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="Imprimir">🖨️</button>
          <button onClick={onClose} className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Fechar">✕</button>
        </div>
      </header>

      {/* 2. CONTEÚDO (Rolagem Livre no Meio) */}
      <main className="overflow-y-auto p-4 pb-24 space-y-6 custom-scrollbar">
        
        {/* Dados Técnicos (Grid) */}
        <div className="grid grid-cols-2 gap-3">
            <TechWidget icon="⚡" color="yellow" label="UC" value={cliente.unidade_consumidora} />
            <TechWidget icon="🏢" color="blue" label="Concessionária" value={cliente.concessionaria} />
            <TechWidget icon="🔌" color="green" label="Disjuntor" value={cliente.disjuntor_padrao} />
            <TechWidget icon="⚙️" color="blue" label="Sistema" value={cliente.tipo_sistema} />
        </div>

        {/* Localização (Mapa e Coordenadas) */}
        <section className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Localização da Instalação</h3>
                <p className="text-sm text-slate-200 font-medium leading-snug">{fullAddress}</p>
            </div>
            
            {/* Mapa */}
            <div className="h-48 w-full bg-black relative">
                <iframe
                    width="100%" height="100%" loading="lazy"
                    style={{ border: 0, filter: 'grayscale(30%) invert(90%) contrast(0.8)' }}
                    src={`https://maps.google.com/maps?q=${encodedAddress}&output=embed&t=k`}
                ></iframe>
            </div>

            {/* Barra de Coordenadas UTM */}
            <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-950 py-3">
                <div className="text-center px-2">
                    <span className="block text-[9px] text-slate-500 uppercase font-bold">UTM Norte</span>
                    <span className="text-xs text-green-400 font-mono">{cliente.utm_norte || '-'}</span>
                </div>
                <div className="text-center px-2">
                    <span className="block text-[9px] text-slate-500 uppercase font-bold">UTM Leste</span>
                    <span className="text-xs text-green-400 font-mono">{cliente.utm_leste || '-'}</span>
                </div>
                <div className="text-center px-2">
                    <span className="block text-[9px] text-slate-500 uppercase font-bold">Zona</span>
                    <span className="text-xs text-white font-mono">{cliente.utm_zona || '-'}</span>
                </div>
            </div>
        </section>

        {/* Datas e Prazos */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <h3 className="text-[10px] font-bold text-purple-400 uppercase mb-3 tracking-widest">Cronograma</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-[9px] text-slate-500 uppercase font-bold">Entrada</p><p className="text-[10px] text-white">{formatDate(cliente.data_entrada_homologacao)}</p></div>
                <div><p className="text-[9px] text-slate-500 uppercase font-bold">Resposta</p><p className="text-[10px] text-white">{formatDate(cliente.data_resposta_concessionaria)}</p></div>
                <div><p className="text-[9px] text-slate-500 uppercase font-bold">Vistoria</p><p className="text-[10px] text-white">{formatDate(cliente.data_vistoria)}</p></div>
                <div><p className="text-[9px] text-slate-500 uppercase font-bold">Horas</p><p className="text-[10px] text-white">{cliente.tempo_projeto || 0}h</p></div>
            </div>
        </section>

        {/* Documentos */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3 pl-1">Documentação</h3>
            <div className="grid grid-cols-1 gap-3">
                <DocCard title="Identificação" status={cliente.doc_identificacao_status} anexos={cliente.anexos_identificacao} />
                <DocCard title="Conta de Energia" status={cliente.conta_energia_status} anexos={cliente.anexos_conta} />
                <DocCard title="Procuração" status={cliente.procuracao_status} anexos={cliente.anexos_procuracao} />
                <DocCard title="Outros / Fotos" status={cliente.outras_imagens_status} anexos={cliente.anexos_outras_imagens} />
            </div>
        </section>

        {/* Rodapé Interno (Copyright) */}
        <div className="text-center opacity-30 pb-8">
            <p className="text-[10px] uppercase tracking-widest">SolarTekPro System</p>
        </div>

      </main>

      {/* 3. RODAPÉ FIXO (Navegação) */}
      <footer className="bg-slate-900 border-t border-slate-800 p-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex gap-3">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" 
               className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-blue-400 border border-blue-900/30 hover:bg-blue-900/20 hover:border-blue-500 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-95">
               <span>📍</span> Google Maps
            </a>
            <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
               className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-cyan-400 border border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-500 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-95">
               <span>🚗</span> Waze
            </a>
        </div>
      </footer>

    </div>
  );
};
