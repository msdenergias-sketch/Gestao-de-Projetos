
import React, { useState, useMemo } from 'react';
import { Servico, Despesa, Cliente, FinanceSummary, StatusServico } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FinancialDashboardProps {
  servicos: Servico[];
  despesas: Despesa[];
  clientes: Cliente[];
  onSaveServico: (s: Servico) => void;
  onSaveDespesa: (d: Despesa) => void;
  onDeleteServico: (id: string) => void;
  onDeleteDespesa: (id: string) => void;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  servicos, despesas, clientes, onSaveServico, onSaveDespesa, onDeleteServico, onDeleteDespesa
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'servicos' | 'despesas'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'servico' | 'despesa'>('servico');
  const [editingItem, setEditingItem] = useState<any>(null);

  const summary = useMemo<FinanceSummary>(() => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    let recebido = 0;
    let pendente = 0;
    let atrasado = 0;
    let vencendo = 0;
    let faturado = 0;
    let totalDespesas = 0;
    let ativos = 0;
    let qtdAtraso = 0;
    let qtdVencendo = 0;

    servicos.forEach(s => {
      faturado += s.valor;
      if (s.status === StatusServico.PAGO) {
        recebido += s.valor;
      } else if ([StatusServico.APROVADO, StatusServico.EM_ANDAMENTO, StatusServico.CONCLUIDO].includes(s.status)) {
        pendente += s.valor;
        ativos++;

        if (s.data_vencimento) {
          const venc = new Date(s.data_vencimento);
          venc.setHours(0,0,0,0);
          const diffTime = venc.getTime() - hoje.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            atrasado += s.valor;
            qtdAtraso++;
          } else if (diffDays <= 7) {
            vencendo += s.valor;
            qtdVencendo++;
          }
        }
      }
    });

    despesas.forEach(d => totalDespesas += d.valor);

    return {
      recebido,
      pendente,
      atrasado,
      vencendo,
      faturado,
      despesas: totalDespesas,
      lucro: recebido - totalDespesas,
      ativos,
      qtdAtraso,
      qtdVencendo
    };
  }, [servicos, despesas]);

  const chartData = useMemo(() => {
    const data: Record<string, { name: string; Receitas: number; Despesas: number }> = {};
    
    servicos.forEach(s => {
      if (s.status === StatusServico.PAGO && s.data_pagamento) {
        const date = new Date(s.data_pagamento);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!data[key]) data[key] = { name: key, Receitas: 0, Despesas: 0 };
        data[key].Receitas += s.valor;
      }
    });

    despesas.forEach(d => {
      if (d.data_despesa) {
        const date = new Date(d.data_despesa);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!data[key]) data[key] = { name: key, Receitas: 0, Despesas: 0 };
        data[key].Despesas += d.valor;
      }
    });

    return Object.values(data).sort((a, b) => a.name.localeCompare(b.name)).slice(-6); 
  }, [servicos, despesas]);

  const SummaryCard = ({ title, value, icon, colorClass, subtext }: any) => (
    <div className={`${colorClass} rounded-2xl p-5 text-white shadow-lg border border-white/10 backdrop-blur-sm relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl transform translate-x-4 -translate-y-2 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="relative z-10">
        <p className="opacity-80 text-sm font-bold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}</p>
        {subtext && <p className="text-xs opacity-80 mt-1 font-medium bg-black/20 inline-block px-2 py-0.5 rounded">{subtext}</p>}
      </div>
    </div>
  );

  const FormModal = () => {
    const [localData, setLocalData] = useState<any>(editingItem || {});
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (modalType === 'servico') {
        const cliente = clientes.find(c => c.id === localData.cliente_id);
        onSaveServico({
          ...localData,
          id: localData.id || `srv_${Date.now()}`,
          cliente_nome: cliente?.nome || '',
          valor: Number(localData.valor),
          data_cadastro: localData.data_cadastro || new Date().toISOString()
        });
      } else {
        onSaveDespesa({
          ...localData,
          id: localData.id || `dsp_${Date.now()}`,
          valor: Number(localData.valor),
          data_cadastro: localData.data_cadastro || new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      const amount = Number(rawValue) / 100;
      setLocalData({ ...localData, valor: amount });
    };

    const formatCurrency = (value: number) => {
      if (value === undefined || value === null) return '';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const inputClass = "w-full rounded-lg bg-slate-800 border-slate-600 text-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1 border outline-none transition-all placeholder-slate-500";

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg animate-scale-in shadow-2xl">
          <h3 className="text-xl font-black mb-6 text-white flex items-center gap-2">
            {modalType === 'servico' ? (editingItem.id ? '✏️ Editar Serviço' : '➕ Novo Serviço') : (editingItem.id ? '✏️ Editar Despesa' : '➖ Nova Despesa')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modalType === 'servico' && (
              <>
                <select 
                  required 
                  className={inputClass}
                  value={localData.cliente_id || ''} 
                  onChange={e => setLocalData({...localData, cliente_id: e.target.value})}
                >
                  <option value="">Selecione o Cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    required
                    className={inputClass}
                    value={localData.tipo_servico || ''}
                    onChange={e => setLocalData({...localData, tipo_servico: e.target.value})}
                  >
                     <option value="">Tipo de Serviço</option>
                     <option value="consultoria">Consultoria</option>
                     <option value="projeto">Projeto</option>
                     <option value="homologacao">Homologação</option>
                     <option value="vistoria">Vistoria</option>
                     <option value="instalacao">Instalação</option>
                  </select>
                  <select
                     className={inputClass}
                     value={localData.status || StatusServico.ORCAMENTO}
                     onChange={e => setLocalData({...localData, status: e.target.value})}
                  >
                     {Object.values(StatusServico).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
                <input type="date" placeholder="Vencimento" className={inputClass} value={localData.data_vencimento || ''} onChange={e => setLocalData({...localData, data_vencimento: e.target.value})} />
              </>
            )}
            
            {modalType === 'despesa' && (
               <div className="grid grid-cols-2 gap-3">
                 <input type="date" required className={inputClass} value={localData.data_despesa || ''} onChange={e => setLocalData({...localData, data_despesa: e.target.value})} />
                 <select required className={inputClass} value={localData.categoria || ''} onChange={e => setLocalData({...localData, categoria: e.target.value})}>
                    <option value="">Categoria</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="combustivel">Combustível</option>
                    <option value="transportes">Transportes</option>
                    <option value="materiais_eletricos">Materiais Elétricos</option>
                    <option value="prestador_servico">Prestador de Serviço</option>
                    <option value="equipamentos">Equipamentos</option>
                    <option value="escritorio">Escritório</option>
                    <option value="marketing">Marketing</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="impostos">Taxas e Impostos</option>
                    <option value="outros">Outros</option>
                 </select>
               </div>
            )}

            <input type="text" placeholder="Descrição" required className={inputClass} value={localData.descricao || ''} onChange={e => setLocalData({...localData, descricao: e.target.value})} />
            
            <input 
              type="text" 
              inputMode="numeric"
              placeholder="Valor (R$)" 
              required 
              className={`${inputClass} font-bold text-green-400 text-lg`} 
              value={formatCurrency(localData.valor)} 
              onChange={handleCurrencyChange} 
            />
            
             {modalType === 'servico' && localData.status === StatusServico.PAGO && (
                <input type="date" required placeholder="Data Pagamento" className={inputClass} value={localData.data_pagamento || ''} onChange={e => setLocalData({...localData, data_pagamento: e.target.value})} />
             )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-slate-800 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-colors font-bold">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all font-bold">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex space-x-1 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 backdrop-blur">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('servicos')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'servicos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>💼 Serviços</button>
          <button onClick={() => setActiveTab('despesas')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'despesas' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>💸 Despesas</button>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => { setModalType('servico'); setEditingItem({}); setIsModalOpen(true); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 shadow-lg hover:shadow-green-500/20 flex items-center gap-2 text-sm font-bold transition-all">➕ Novo Serviço</button>
          <button onClick={() => { setModalType('despesa'); setEditingItem({}); setIsModalOpen(true); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 shadow-lg hover:shadow-red-500/20 flex items-center gap-2 text-sm font-bold transition-all">➖ Nova Despesa</button>
        </div>
      </div>

      {/* Summary Cards */}
      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Recebido" value={summary.recebido} icon="💰" colorClass="bg-gradient-to-br from-green-600 to-emerald-800" />
            <SummaryCard title="A Receber" value={summary.pendente} icon="⏳" colorClass="bg-gradient-to-br from-yellow-500 to-amber-700" />
            <SummaryCard title="Em Atraso" value={summary.atrasado} icon="🚨" colorClass="bg-gradient-to-br from-red-500 to-rose-800" subtext={`${summary.qtdAtraso} serviços`} />
            <SummaryCard title="Lucro Líquido" value={summary.lucro} icon="📈" colorClass="bg-gradient-to-br from-blue-600 to-indigo-800" />
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl shadow-2xl border border-white/5 backdrop-blur">
            <h3 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-wider">Fluxo de Caixa (Últimos 6 Meses)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px'}}
                    formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)} 
                  />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="Receitas" fill="#10B981" name="Receitas" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="Despesas" fill="#EF4444" name="Despesas" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Tables */}
      {activeTab === 'servicos' && (
        <div className="bg-slate-900/50 rounded-2xl shadow-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
          <table className="min-w-full text-left">
            <thead className="bg-black/20 text-slate-400 border-b border-white/5 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">Serviço</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {servicos.map(s => {
                const isOverdue = s.status !== StatusServico.PAGO && 
                                  s.status !== StatusServico.CANCELADO &&
                                  s.data_vencimento && 
                                  new Date(s.data_vencimento) < new Date(new Date().setHours(0,0,0,0));

                return (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm text-white font-medium">{s.cliente_nome}</td>
                    <td className="p-4 text-sm text-slate-400">{s.tipo_servico}</td>
                    <td className="p-4 text-sm font-bold text-green-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valor)}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-full border 
                        ${s.status === StatusServico.PAGO ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                          s.status === StatusServico.CANCELADO ? 'bg-slate-700 text-slate-300 border-slate-600' :
                          isOverdue ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                          'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm space-x-2">
                      <button onClick={() => { setModalType('servico'); setEditingItem(s); setIsModalOpen(true); }} className="text-blue-400 hover:text-white font-medium transition-colors">Editar</button>
                      <button onClick={() => onDeleteServico(s.id)} className="text-red-400 hover:text-white font-medium transition-colors">Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'despesas' && (
        <div className="bg-slate-900/50 rounded-2xl shadow-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
          <table className="min-w-full text-left">
            <thead className="bg-black/20 text-slate-400 border-b border-white/5 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Valor</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {despesas.map(d => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-sm text-slate-400">{d.data_despesa}</td>
                  <td className="p-4 text-sm text-slate-300 capitalize">{d.categoria.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-sm text-white">{d.descricao}</td>
                  <td className="p-4 text-sm font-bold text-red-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}
                  </td>
                  <td className="p-4 text-right text-sm space-x-2">
                    <button onClick={() => { setModalType('despesa'); setEditingItem(d); setIsModalOpen(true); }} className="text-blue-400 hover:text-white font-medium transition-colors">Editar</button>
                    <button onClick={() => onDeleteDespesa(d.id)} className="text-red-400 hover:text-white font-medium transition-colors">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && <FormModal />}
    </div>
  );
};
