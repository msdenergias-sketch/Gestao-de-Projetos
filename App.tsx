
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { Cliente, Servico, Despesa } from './types';
import { ClientForm } from './components/ClientForm';
import { FinancialDashboard } from './components/FinancialDashboard';
import { ClientDetails } from './components/ClientDetails';

type ViewState = 'list' | 'form' | 'financial';

// --- COMPONENTE DE TELA DE BOAS-VINDAS (DARK LUMINOUS THEME) ---
const WelcomeScreen = ({ onEnter }: { onEnter: () => void }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050b14] flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="animate-scale-in flex flex-col items-center max-w-2xl w-full relative z-10">
        
        {/* Logo Container - Glowing */}
        <div className="relative mb-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-white p-1 rounded-full shadow-2xl w-28 h-28 flex items-center justify-center overflow-hidden">
            {!logoError ? (
                <img 
                src="https://drive.google.com/thumbnail?id=1hlyKB3L9oHLtRSrCV-JNdQXpZELdML-p&sz=w400" 
                alt="Logo SolarTekPro" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                />
            ) : (
                <div className="text-5xl">☀️</div>
            )}
            </div>
        </div>

        {/* Marca LUMINOSA */}
        <h1 className="text-5xl md:text-6xl font-black text-white mb-1 tracking-tight leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          SolarTek<span className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">Pro</span>
        </h1>
        <p className="text-sm md:text-base text-cyan-300 font-bold tracking-[0.3em] uppercase mb-8 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
          Energias Renováveis
        </p>

        {/* Títulos de Boas Vindas */}
        <div className="space-y-1 mb-8">
          <h2 className="text-lg md:text-xl font-medium text-gray-400 tracking-wide">
            Bem-vindo ao Moderno
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Sistema de Gestão de Clientes
          </h3>
        </div>

        {/* Missão - Dark Glass */}
        <div className="relative group mb-10 max-w-lg w-full">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-md px-6 py-6 rounded-xl border border-white/10 shadow-2xl">
            <p className="text-gray-200 text-base md:text-lg font-medium leading-relaxed italic text-shadow-sm">
              "Nossa Missão é trabalhar de forma organizada para que a cada dia possamos atender nossos clientes com mais efetividade."
            </p>
          </div>
        </div>

        {/* Botão de Ação - Neon */}
        <button 
          onClick={onEnter}
          className="group relative inline-flex items-center justify-center px-10 py-3 text-base md:text-lg font-bold text-black transition-all duration-200 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full focus:outline-none hover:scale-105 hover:shadow-[0_0_30px_rgba(74,222,128,0.6)] active:scale-95"
        >
          <span className="mr-2">Acessar Sistema</span>
          <svg className="w-5 h-5 text-black transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <div className="absolute bottom-6 text-[10px] text-gray-500 flex flex-col items-center gap-1">
          <p className="tracking-widest uppercase opacity-60">SolarTekPro Technology © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [view, setView] = useState<ViewState>('list');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteVisualizando, setClienteVisualizando] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // if (clientes.length === 0) setLoading(true); // Removed global loader to avoid flickering on updates
    try {
      const [c, s, d] = await Promise.all([
        StorageService.getClientes(),
        StorageService.getServicos(),
        StorageService.getDespesas()
      ]);
      setClientes(c);
      setServicos(s);
      setDespesas(d);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setView('form');
  };

  const handleDeleteCliente = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Garante que não clica na linha
    e.preventDefault();
    
    if (window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      const backup = [...clientes];
      
      // 1. Atualização Otimista: Remove da tela imediatamente
      setClientes(prev => prev.filter(c => c.id !== id));

      try {
        // 2. Executa a exclusão no banco
        await StorageService.deleteCliente(id);
        // Não recarregamos loadData() aqui para evitar que o dado antigo volte se houver delay
      } catch (error) {
        console.error("Erro ao excluir", error);
        alert("Erro ao excluir cliente. A lista será restaurada.");
        setClientes(backup); // Restaura se der erro
      }
    }
  };

  const handleSaveCliente = () => {
    loadData();
    setView('list');
    setClienteEditando(null);
  };

  const handleSaveServico = async (s: Servico) => {
    await StorageService.saveServico(s);
    loadData();
  };
  const handleDeleteServico = async (id: string) => {
    setServicos(prev => prev.filter(s => s.id !== id));
    await StorageService.deleteServico(id);
    // loadData(); // Removido para evitar flash
  };
  const handleSaveDespesa = async (d: Despesa) => {
    await StorageService.saveDespesa(d);
    loadData();
  };
  const handleDeleteDespesa = async (id: string) => {
    setDespesas(prev => prev.filter(d => d.id !== id));
    await StorageService.deleteDespesa(id);
    // loadData(); // Removido para evitar flash
  };
  
  // --- FUNÇÕES DE BACKUP E RESTAURAÇÃO ---
  const handleBackup = () => {
    const data = {
      clientes,
      servicos,
      despesas,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_solartek_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = () => {
    if (!window.confirm("⚠️ ATENÇÃO: Restaurar um backup irá SUBSTITUIR todos os dados atuais.\n\nRecomendamos fazer um backup dos dados atuais antes de continuar.\n\nDeseja prosseguir?")) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.clientes) localStorage.setItem('sgs_clientes', JSON.stringify(json.clientes));
          if (json.servicos) localStorage.setItem('sgs_servicos', JSON.stringify(json.servicos));
          if (json.despesas) localStorage.setItem('sgs_despesas', JSON.stringify(json.despesas));
          alert("✅ Dados restaurados com sucesso! A página será recarregada.");
          window.location.reload();
        } catch (err) {
          alert("❌ Erro ao ler arquivo de backup. O arquivo pode estar corrompido.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  const handleReload = () => {
    window.location.reload();
  };

  if (showWelcome) {
    return <WelcomeScreen onEnter={() => setShowWelcome(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050b14]">
        <div className="text-2xl text-green-400 font-bold animate-pulse drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">Carregando Sistema SolarTek...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b14] text-gray-200 font-sans selection:bg-green-500/30 selection:text-green-200">
      
      {/* Background Glow Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* FOOTER FIXO COM BOTÕES DE BACKUP */}
      <footer className="bg-slate-900/90 backdrop-blur text-white py-3 fixed bottom-0 w-full z-40 border-t border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] no-print">
        <div className="container mx-auto px-4 max-w-[95%] flex flex-col md:flex-row justify-between items-center text-xs md:text-sm gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-white p-0.5 rounded-full w-6 h-6 flex items-center justify-center overflow-hidden">
               <img 
                  src="https://drive.google.com/thumbnail?id=1hlyKB3L9oHLtRSrCV-JNdQXpZELdML-p&sz=w100" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
               />
            </div>
            <span className="font-bold tracking-wide text-gray-200">
              SolarTek <span className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">Pro</span>
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400">Todos os direitos reservados © {new Date().getFullYear()}</span>
          </div>
          
          {/* BOTÕES DE BACKUP E RESTAURAÇÃO */}
          <div className="flex items-center gap-4">
             <button onClick={handleBackup} className="hover:text-blue-400 transition-colors flex items-center gap-1 text-slate-400 font-bold bg-slate-800/50 px-3 py-1 rounded border border-slate-700 hover:border-blue-500">
               💾 Backup
             </button>
             <button onClick={handleRestore} className="hover:text-yellow-400 transition-colors flex items-center gap-1 text-slate-400 font-bold bg-slate-800/50 px-3 py-1 rounded border border-slate-700 hover:border-yellow-500">
               📂 Restaurar
             </button>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5 hover:text-green-400 transition-colors cursor-pointer">
              <span className="text-pink-500 text-base">📞</span>
              <span>(51) 99166-3470</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <span className="text-blue-400 text-base">📧</span>
              <a href="mailto:solartekpro@gmail.com" className="hover:underline decoration-blue-400/50">solartekpro@gmail.com</a>
            </div>
          </div>
        </div>
      </footer>

      <div className="container mx-auto px-2 py-6 max-w-[95%] pb-20 relative z-10">
        <header className="text-center mb-8">
          <div className="mb-4 flex flex-col items-center justify-center">
            {/* Cabeçalho Glassmorphism */}
            <div className="flex flex-col md:flex-row items-center gap-5 bg-slate-900/60 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/5 w-full max-w-3xl mx-auto hover:border-white/10 transition-all duration-500">
              
              {/* Logo Circle */}
              <div className="relative flex-shrink-0 group cursor-pointer z-50" onClick={handleReload} title="Recarregar Sistema">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-green-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-white p-1 rounded-full w-20 h-20 flex items-center justify-center overflow-hidden border-2 border-slate-900">
                  {!logoError ? (
                    <img 
                      src="https://drive.google.com/thumbnail?id=1hlyKB3L9oHLtRSrCV-JNdQXpZELdML-p&sz=w200" 
                      alt="Logo SolarTekPro" 
                      className="w-full h-full object-contain pointer-events-none"
                      referrerPolicy="no-referrer"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="text-2xl">☀️</div>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center md:text-left flex-grow">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-1 drop-shadow-lg">
                  SolarTek<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]">Pro</span>
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
                   <span className="h-px w-8 bg-blue-500/50"></span>
                   <p className="text-[11px] md:text-xs font-bold text-cyan-300 tracking-[0.3em] uppercase shadow-black drop-shadow-sm">
                     Energias Renováveis
                   </p>
                   <span className="h-px w-8 bg-green-500/50 md:hidden"></span>
                </div>
              </div>

              {/* System Label */}
              <div className="hidden md:block border-l border-white/10 pl-6 ml-2">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Sistema de</span>
                  <span className="block text-lg font-bold text-slate-200">Gestão</span>
              </div>
            </div>
          </div>
        </header>

        {/* NAV BAR GLASS */}
        <nav className="flex justify-center mb-8 sticky top-4 z-50 no-print">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.4)] p-1.5 flex space-x-1 border border-white/10">
            <button 
              onClick={() => { setClienteEditando(null); setView('form'); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${view === 'form' && !clienteEditando ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>💼</span> Novo Cliente
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${view === 'list' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>📋</span> Lista de Clientes
            </button>
            <button 
              onClick={() => setView('financial')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${view === 'financial' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>💰</span> Controle Financeiro
            </button>
          </div>
        </nav>

        <main className="animate-fade-in pb-4">
          {view === 'list' && (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Lista de Clientes
                </h2>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                  Total: {clientes.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/20 text-slate-400 font-bold border-b border-white/5 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Nome</th>
                      <th className="p-4">CPF/CNPJ</th>
                      <th className="p-4">UC</th>
                      <th className="p-4">Concessionária</th>
                      <th className="p-4">Sistema</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {clientes.length === 0 ? (
                      <tr><td colSpan={7} className="p-10 text-center text-slate-500 italic">Nenhum cliente cadastrado.</td></tr>
                    ) : (
                      clientes.map(cliente => (
                        <tr key={cliente.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4 font-bold text-white">{cliente.nome}</td>
                          <td className="p-4 text-slate-400 font-mono">{cliente.cpf}</td>
                          <td className="p-4 text-slate-300 font-mono">{cliente.unidade_consumidora}</td>
                          <td className="p-4 text-slate-300">{cliente.concessionaria}</td>
                          <td className="p-4 text-slate-300">{cliente.tipo_sistema}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm border backdrop-blur-sm
                              ${cliente.status === 'Concluído' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                cliente.status === 'Em Homologação' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                                'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                              {cliente.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button 
                              type="button"
                              onClick={() => setClienteVisualizando(cliente)} 
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg transition-all border border-white/5" 
                              title="Visualizar Detalhes"
                            >
                              👁️
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleEditCliente(cliente)} 
                              className="bg-blue-900/30 hover:bg-blue-600 text-blue-300 hover:text-white p-2 rounded-lg transition-all border border-blue-500/20 hover:border-blue-500" 
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => handleDeleteCliente(e, cliente.id)} 
                              className="bg-red-900/30 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg transition-all border border-red-500/20 hover:border-red-500" 
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'form' && (
            <ClientForm 
              clienteEditando={clienteEditando} 
              onCancel={() => setView('list')} 
              onSave={handleSaveCliente} 
            />
          )}

          {view === 'financial' && (
            <FinancialDashboard 
              servicos={servicos}
              despesas={despesas}
              clientes={clientes}
              onSaveServico={handleSaveServico}
              onSaveDespesa={handleSaveDespesa}
              onDeleteServico={handleDeleteServico}
              onDeleteDespesa={handleDeleteDespesa}
            />
          )}

          {clienteVisualizando && (
            <ClientDetails 
              cliente={clienteVisualizando} 
              onClose={() => setClienteVisualizando(null)} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
