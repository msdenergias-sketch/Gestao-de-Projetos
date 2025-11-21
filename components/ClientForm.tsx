
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Anexo } from '../types';
import { StorageService } from '../services/storageService';

interface ClientFormProps {
  clienteEditando: Cliente | null;
  onCancel: () => void;
  onSave: () => void;
}

// --- FUNÇÕES AUXILIARES DE CONVERSÃO UTM ---
// Conversão simplificada WGS84 para UTM
function latLonToUTM(lat: number, lon: number) {
  if (!(-80 <= lat && lat <= 84)) return null;
  const falseEasting = 500000.0;
  const falseNorthing = lat < 0 ? 10000000.0 : 0.0;
  const semiMajor = 6378137.0;
  const flattening = 1 / 298.257223563;
  const zone = Math.floor((lon + 180.0) / 6) + 1;
  const centralMeridian = (zone - 1) * 6 - 180 + 3;
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180);
  const cmRad = centralMeridian * (Math.PI / 180);
  const k0 = 0.9996;
  
  const eSq = flattening * (2 - flattening);
  const ePrimeSq = eSq / (1 - eSq);
  const N = semiMajor / Math.sqrt(1 - eSq * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = ePrimeSq * Math.cos(latRad) * Math.cos(latRad);
  const A = (lonRad - cmRad) * Math.cos(latRad);
  const M = semiMajor * ((1 - eSq / 4 - 3 * eSq * eSq / 64 - 5 * eSq * eSq * eSq / 256) * latRad
      - (3 * eSq / 8 + 3 * eSq * eSq / 32 + 45 * eSq * eSq * eSq / 1024) * Math.sin(2 * latRad)
      + (15 * eSq * eSq / 256 + 45 * eSq * eSq * eSq / 1024) * Math.sin(4 * latRad)
      - (35 * eSq * eSq * eSq / 3072) * Math.sin(6 * latRad));
  
  const easting = falseEasting + k0 * N * (A + (1 - T + C) * A * A * A / 6
      + (5 - 18 * T + T * T + 72 * C - 58 * ePrimeSq) * A * A * A * A * A / 120);
  const northing = falseNorthing + k0 * (M + N * Math.tan(latRad) * (A * A / 2
      + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
      + (61 - 58 * T + T * T + 600 * C - 330 * ePrimeSq) * A * A * A * A * A * A / 720));

  // Determinar letra da zona (Aproximado)
  const letters = 'CDEFGHJKLMNPQRSTUVWXX';
  const letterIndex = Math.floor((lat + 80) / 8);
  const letter = letters[letterIndex] || 'X';

  return {
    easting: easting.toFixed(2),
    northing: northing.toFixed(2),
    zone: `${zone}${letter}`
  };
}

// --- COMPONENTES AUXILIARES (Definidos fora para evitar re-renderização) ---
const InputField = ({ label, name, value, type = "text", onChange, maxLength, placeholder, list, className = "col-span-12", autoComplete, readOnly }: any) => (
  <div className={className}>
    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      maxLength={maxLength}
      placeholder={placeholder}
      list={list}
      autoComplete={autoComplete}
      readOnly={readOnly}
      className={`block w-full rounded-lg bg-slate-700/50 border-slate-600 text-white shadow-inner focus:border-blue-500 focus:ring-blue-500 focus:ring-1 py-2.5 px-3 text-base border transition-all placeholder-slate-500 ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`} 
    />
  </div>
);

const initialCliente: Cliente = {
  id: '',
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  ponto_referencia: '',
  unidade_consumidora: '',
  concessionaria: '',
  disjuntor_padrao: '',
  tipo_sistema: '',
  utm_norte: '',
  utm_leste: '',
  utm_zona: '',
  tempo_projeto: 0,
  data_entrada_homologacao: '',
  data_resposta_concessionaria: '',
  data_vistoria: '',
  status: 'Coleta de Dados do Cliente',
  data_cadastro: '',
  datas_etapas: {},
  doc_identificacao_status: 'Pendente',
  conta_energia_status: 'Pendente',
  procuracao_status: 'Pendente',
  outras_imagens_status: 'Pendente',
  anexos_identificacao: [],
  anexos_conta: [],
  anexos_procuracao: [],
  anexos_outras_imagens: []
};

const PROJECT_STAGES = [
  "Coleta de Dados do Cliente",
  "Análise do consumo e viabilidade",
  "Dimensionamento do sistema",
  "Orçamento Aprovado",
  "Visita Técnica",
  "Análise Técnica",
  "Em Projeto",
  "Projeto técnico e registro",
  "Envio Para a Concessionaria",
  "Protocolo da Concessionaria",
  "Aguardando a Concessionaria",
  "Em Homologação",
  "Instalação e testes finais",
  "Aguardando Vistoria",
  "Vistoria Realizada",
  "Concluído",
  "Monitoramento e manutenção contínua"
];

const REFERENCIA_OPTIONS = [
  "Próximo ao mercado",
  "Em frente à escola",
  "Ao lado do posto de saúde",
  "Casa de esquina",
  "Portão de grade branca",
  "Muro alto",
  "Próximo à igreja",
  "Fundo da rua",
  "Casa com varanda",
  "Ao lado da padaria"
];

export const ClientForm: React.FC<ClientFormProps> = ({ clienteEditando, onCancel, onSave }) => {
  const [formData, setFormData] = useState<Cliente>(initialCliente);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [findingLocation, setFindingLocation] = useState(false);
  
  const numeroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (clienteEditando) {
      setFormData({
        ...clienteEditando,
        datas_etapas: clienteEditando.datas_etapas || {}
      });
    } else {
      setFormData({ 
        ...initialCliente, 
        id: `cli_${Date.now()}`, 
        data_cadastro: new Date().toISOString(),
        datas_etapas: { "Coleta de Dados do Cliente": new Date().toISOString().split('T')[0] }
      });
    }
  }, [clienteEditando]);

  // Lógica automática de status baseada nas datas
  useEffect(() => {
    setFormData(prev => {
      // Se nada mudou, retorna o estado anterior para evitar loop
      return prev;
    });
  }, [formData.data_entrada_homologacao, formData.data_resposta_concessionaria, formData.data_vistoria]);

  const mascaraCpfCnpj = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    return v;
  };

  const mascaraCep = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{5})(\d)/, "$1-$2");
    return v;
  };

  const mascaraTelefone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    if (v.length > 7) v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
  };

  const buscarGeolocalizacao = async (logradouro: string, cidade: string, uf: string = "") => {
    setFindingLocation(true);
    try {
      // Busca coordenadas no OpenStreetMap (Nominatim)
      const query = `${logradouro}, ${cidade}, Brasil`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        // Converter para UTM
        const utm = latLonToUTM(lat, lon);
        
        if (utm) {
          setFormData(prev => ({
            ...prev,
            utm_norte: utm.northing,
            utm_leste: utm.easting,
            utm_zona: utm.zone
          }));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar geolocalização", error);
    } finally {
      setFindingLocation(false);
    }
  };

  const buscarEndereco = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            complemento: prev.complemento || data.complemento
          }));
          
          // Após obter endereço, buscar coordenadas UTM
          if (data.logradouro && data.localidade) {
            buscarGeolocalizacao(data.logradouro, data.localidade, data.uf);
          }

          // Focar no número após preencher
          setTimeout(() => {
            if (numeroInputRef.current) {
              numeroInputRef.current.focus();
            }
          }, 100);
        }
      } catch (error) {
        console.log("Erro ao buscar CEP");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // Aplicar máscaras apenas se o usuário estiver digitando (não apagando tudo)
    if (value) {
      if (name === 'cpf') {
        value = mascaraCpfCnpj(value);
      } else if (name === 'cep') {
        const rawValue = value.replace(/\D/g, '');
        value = mascaraCep(value);
        if (rawValue.length === 8) {
          buscarEndereco(value);
        }
      } else if (name === 'telefone') {
        value = mascaraTelefone(value);
      }
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Se mudar o status manualmente, registra a data de hoje
      if (name === 'status') {
        const hoje = new Date().toISOString().split('T')[0];
        newData.datas_etapas = {
          ...prev.datas_etapas,
          [value]: hoje
        };
      }
      return newData;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'identificacao' | 'conta' | 'procuracao' | 'outras') => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setLoading(true);
    const files = Array.from(e.target.files) as File[];
    const newAnexos: Anexo[] = [];
    
    // Limite de 15MB por arquivo
    const MAX_SIZE_MB = 15; 

    for (const file of files) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`O arquivo ${file.name} é muito grande. Tente arquivos menores que ${MAX_SIZE_MB}MB.`);
        continue;
      }

      try {
        const base64 = await StorageService.fileToBase64(file);
        newAnexos.push({
          id: `anexo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
          dataUpload: new Date().toISOString(),
          dados: base64
        });
      } catch (err) {
        console.error("Erro ao processar arquivo", err);
        alert(`Erro ao processar ${file.name}.`);
      }
    }

    setFormData(prev => {
      const fieldMap = {
        identificacao: 'anexos_identificacao',
        conta: 'anexos_conta',
        procuracao: 'anexos_procuracao',
        outras: 'anexos_outras_imagens'
      };
      const key = fieldMap[tipo] as keyof Cliente;
      const currentList = prev[key] as Anexo[];
      return { ...prev, [key]: [...currentList, ...newAnexos] };
    });
    setLoading(false);
  };

  const removeAnexo = (tipo: 'identificacao' | 'conta' | 'procuracao' | 'outras', id: string) => {
    setFormData(prev => {
      const fieldMap = {
        identificacao: 'anexos_identificacao',
        conta: 'anexos_conta',
        procuracao: 'anexos_procuracao',
        outras: 'anexos_outras_imagens'
      };
      const key = fieldMap[tipo] as keyof Cliente;
      const currentList = prev[key] as Anexo[];
      return { ...prev, [key]: currentList.filter(a => a.id !== id) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveMessage(null);
    
    try {
      // Clone limpo
      const updatedData = JSON.parse(JSON.stringify(formData));
      
      console.log("Tentando salvar dados:", updatedData);

      try {
        await StorageService.saveCliente(updatedData);
        // Fallback para LocalStorage já implementado no Service se firebase falhar
      } catch (dbError) {
        console.error("Erro específico no banco:", dbError);
        throw new Error("Falha na persistência.");
      }

      setSaveMessage("✅ Cliente salvo com sucesso!");
      setTimeout(() => {
        onSave();
      }, 1000);

    } catch (error: any) {
      console.error("Erro ao salvar geral:", error);
      if (error.message === "LIMITE_ATINGIDO") {
        alert("⚠️ ESPAÇO CHEIO!\nLimite de armazenamento atingido.");
      } else {
        alert(`Erro ao salvar: ${error.message || "Tente novamente."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const renderTabs = () => (
    <div className="flex mb-6 border-b border-white/10 overflow-x-auto">
      {[1, 2, 3, 4].map(step => (
        <button
          key={step}
          type="button"
          onClick={() => setCurrentStep(step)}
          className={`px-6 py-3 font-bold text-sm focus:outline-none transition-all whitespace-nowrap border-b-2 ${
            currentStep === step
              ? 'border-blue-500 text-white bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {step === 1 && "1. Dados Pessoais"}
          {step === 2 && "2. Instalação"}
          {step === 3 && "3. Documentos"}
          {step === 4 && "4. Projeto"}
        </button>
      ))}
    </div>
  );

  const renderDadosPessoais = () => (
    <div className="grid grid-cols-12 gap-3 animate-fade-in pb-24">
      {/* Linha 1: Nome, CPF, Telefone */}
      <InputField className="col-span-12 md:col-span-5" label="Nome Completo" name="nome" value={formData.nome} onChange={handleChange} autoComplete="name" />
      <InputField className="col-span-12 md:col-span-3" label="CPF/CNPJ" name="cpf" value={formData.cpf} onChange={handleChange} maxLength={18} placeholder="000.000.000-00" />
      <InputField className="col-span-12 md:col-span-4" label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} maxLength={15} placeholder="(00) 00000-0000" autoComplete="tel" />

      {/* Linha 2: Email, CEP, Número, Complemento */}
      <InputField className="col-span-12 md:col-span-4" label="Email" name="email" value={formData.email} type="email" onChange={handleChange} autoComplete="email" />
      <InputField className="col-span-6 md:col-span-2" label="CEP" name="cep" value={formData.cep} onChange={handleChange} maxLength={9} placeholder="00000-000" autoComplete="postal-code" />
      <div className="col-span-6 md:col-span-2">
        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Número</label>
        <input 
            type="text" 
            name="numero" 
            ref={numeroInputRef} 
            value={formData.numero} 
            onChange={handleChange} 
            className="block w-full rounded-lg bg-slate-700/50 border-slate-600 text-white shadow-inner focus:border-blue-500 focus:ring-blue-500 focus:ring-1 py-2.5 px-3 text-base border transition-all placeholder-slate-500" 
        />
      </div>
      <InputField className="col-span-12 md:col-span-4" label="Complemento" name="complemento" value={formData.complemento} onChange={handleChange} />

      {/* Linha 3: Logradouro, Bairro, Cidade */}
      <InputField className="col-span-12 md:col-span-5" label="Logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} autoComplete="street-address" />
      <InputField className="col-span-6 md:col-span-4" label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} autoComplete="address-level2" />
      <InputField className="col-span-6 md:col-span-3" label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} autoComplete="address-level1" />

      {/* Linha 4: Referência */}
      <div className="col-span-12">
        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Ponto de Referência (Opcional)</label>
        <input 
          type="text" 
          name="ponto_referencia" 
          list="referencia-options"
          value={formData.ponto_referencia || ''} 
          onChange={handleChange} 
          placeholder="Ex: Próximo ao mercado..."
          className="block w-full rounded-lg bg-slate-700/50 border-slate-600 text-white shadow-inner focus:border-blue-500 focus:ring-blue-500 focus:ring-1 py-2.5 px-3 text-base border transition-all placeholder-slate-500" 
        />
        <datalist id="referencia-options">
          {REFERENCIA_OPTIONS.map(opt => <option key={opt} value={opt} />)}
        </datalist>
      </div>
    </div>
  );

  const renderInstalacao = () => (
    <div className="grid grid-cols-12 gap-4 pb-24">
      <InputField className="col-span-12 md:col-span-3" label="Unidade Consumidora" name="unidade_consumidora" value={formData.unidade_consumidora} onChange={handleChange} />
      
      <div className="col-span-12 md:col-span-3">
        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Concessionária</label>
        <select name="concessionaria" value={formData.concessionaria} onChange={handleChange} className="block w-full rounded-lg bg-slate-700/50 border-slate-600 text-white shadow-inner focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 text-base border">
          <option value="">Selecione...</option>
          <optgroup label="Rio Grande do Sul (Destaque)">
            {['CEEE EQUATORIAL', 'RGE', 'CERTEL', 'COPREL', 'CERILUZ', 'NOVA PALMA', 'MUXFELDT', 'HIDROPAN', 'ELETROCAR', 'DEMEI'].map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Demais Concessionárias">
            {['AMAZONAS ENERGIA', 'CEB', 'CELESC', 'CEMIG', 'COELBA', 'COPEL', 'CPFL PAULISTA', 'CPFL PIRATININGA', 'CPFL SANTA CRUZ', 'EDP ES', 'EDP SP', 'ELEKTRO', 'ENEL CE', 'ENEL RJ', 'ENEL SP', 'ENERGISA', 'EQUATORIAL AL', 'EQUATORIAL GO', 'EQUATORIAL MA', 'EQUATORIAL PA', 'EQUATORIAL PI', 'LIGHT', 'NEOENERGIA BRASILIA', 'NEOENERGIA PERNAMBUCO', 'NEOENERGIA COSERN', 'RORAIMA ENERGIA', 'SULGIPE'].map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
      </div>

      <div className="col-span-12 md:col-span-2">
        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Disjuntor</label>
        <select name="disjuntor_padrao" value={formData.disjuntor_padrao} onChange={handleChange} className="block w-full rounded-lg bg-slate-700/50 border-slate-600 text-white shadow-inner focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 text-base border">
           <option value="">Selecione...</option>
           {['25A', '32A', '40A', '50A', '63A', '70A', '80A', '100A', '125A', '150A', '200A'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      <div className="col-span-12 md:col-span-4">
        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Tipo Sistema</label>
        <select name="tipo_sistema" value={formData.tipo_sistema} onChange={handleChange} className="block w-full rounded-lg bg-slate-700/50 border-slate-600 text-white shadow-inner focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 text-base border">
           <option value="">Selecione...</option>
           {['MONOFÁSICO 127V', 'MONOFÁSICO 220V', 'BIFÁSICO 127V/220V', 'BIFÁSICO 220V/380V', 'TRIFÁSICO 127V/220V', 'TRIFÁSICO 220V/380V', 'TRIFÁSICO 240V/415V'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* CAMPOS UTM AUTOMÁTICOS */}
      <div className="col-span-12 border-t border-slate-700 mt-4 pt-4">
        <h4 className="text-xs font-bold text-green-400 uppercase mb-3 flex items-center gap-2">
          📍 Coordenadas de Instalação (UTM)
          {findingLocation && <span className="text-[10px] text-slate-400 animate-pulse">(Buscando automaticamente...)</span>}
        </h4>
        <div className="grid grid-cols-3 gap-4">
           <InputField label="Coordenada N (Norte)" name="utm_norte" value={formData.utm_norte} onChange={handleChange} className="col-span-1" />
           <InputField label="Coordenada E (Leste)" name="utm_leste" value={formData.utm_leste} onChange={handleChange} className="col-span-1" />
           <InputField label="Zona UTM" name="utm_zona" value={formData.utm_zona} onChange={handleChange} className="col-span-1" />
        </div>
      </div>

    </div>
  );

  const renderUploadSection = (title: string, statusField: string, fileType: 'identificacao' | 'conta' | 'procuracao' | 'outras', anexos: Anexo[]) => (
    <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/50 flex flex-col h-full hover:border-blue-500/50 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider">{title}</h4>
        <select 
          name={statusField} 
          value={String((formData as any)[statusField])} 
          onChange={handleChange} 
          className="text-xs border-slate-600 bg-slate-700 text-white rounded shadow-sm py-1 px-2 focus:ring-blue-500"
        >
          <option value="Pendente">Pendente</option>
          <option value="Recebido">Recebido</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Rejeitado">Rejeitado</option>
        </select>
      </div>
      <div className="space-y-2 flex-grow mb-3">
        {anexos.map(anexo => (
          <div key={anexo.id} className="flex items-center justify-between bg-slate-700/50 border border-slate-600 p-2 rounded text-xs shadow-sm hover:bg-slate-700">
            <span className="truncate max-w-[150px] text-slate-300" title={anexo.nome}>{anexo.nome}</span>
            <button type="button" onClick={() => removeAnexo(fileType, anexo.id)} className="text-red-400 hover:text-red-300 font-bold px-2">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <label className="cursor-pointer flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-500 hover:shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all">
          📎 Anexar
          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, fileType)} multiple={fileType === 'outras'} accept="image/*,.pdf" />
        </label>
        <label className="cursor-pointer flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-500 hover:shadow-[0_0_10px_rgba(22,163,74,0.5)] transition-all" title="Tirar Foto">
          📷
          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, fileType)} accept="image/*" capture="environment" />
        </label>
      </div>
    </div>
  );

  const renderDocumentos = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-24">
      {renderUploadSection('RG/CNH', 'doc_identificacao_status', 'identificacao', formData.anexos_identificacao)}
      {renderUploadSection('Conta Energia', 'conta_energia_status', 'conta', formData.anexos_conta)}
      {renderUploadSection('Procuração', 'procuracao_status', 'procuracao', formData.anexos_procuracao)}
      {renderUploadSection('Outros', 'outras_imagens_status', 'outras', formData.anexos_outras_imagens)}
    </div>
  );

  const renderProjectTimeline = () => {
    const currentStageIndex = PROJECT_STAGES.indexOf(formData.status);
    
    return (
      <div className="mt-8 col-span-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-700 pb-2">Linha do Tempo do Projeto</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PROJECT_STAGES.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isActive = index === currentStageIndex;
            let stageDate = formData.datas_etapas?.[stage];

            if (!stageDate) {
              if (stage === 'Em Homologação') stageDate = formData.data_entrada_homologacao;
              if (stage === 'Aguardando Vistoria') stageDate = formData.data_resposta_concessionaria;
              if (stage === 'Concluído') stageDate = formData.data_vistoria;
            }

            return (
              <div 
                key={index} 
                className={`relative p-3 rounded-xl border flex flex-col justify-center transition-all duration-300 min-h-[70px] backdrop-blur-sm
                  ${isActive ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-1 ring-blue-500' : 
                    isCompleted ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-800/50 opacity-60 grayscale'}
                `}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-2 text-[10px] font-bold shadow-sm
                    ${isActive ? 'bg-blue-500 text-white shadow-blue-500/50' : 
                      isCompleted ? 'bg-green-500 text-white shadow-green-500/50' : 'bg-slate-600 text-slate-300'}
                  `}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`text-[11px] font-bold leading-tight
                    ${isActive ? 'text-blue-300' : 
                      isCompleted ? 'text-green-400' : 'text-slate-400'}
                  `}>
                    {stage}
                  </span>
                </div>
                
                {isCompleted && stageDate && (
                  <div className={`text-[10px] flex items-center mt-1.5 font-mono ml-7
                     ${isActive ? 'text-blue-200' : 'text-green-200'}
                  `}>
                    {formatDate(stageDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProjeto = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-24">
      <InputField label="Tempo Gasto (h)" name="tempo_projeto" type="number" value={formData.tempo_projeto} onChange={handleChange} className="col-span-2 md:col-span-1" />
      <InputField label="Entrada Homolog." name="data_entrada_homologacao" type="date" value={formData.data_entrada_homologacao} onChange={handleChange} className="col-span-2 md:col-span-1" />
      <InputField label="Resp. Concessionária" name="data_resposta_concessionaria" type="date" value={formData.data_resposta_concessionaria} onChange={handleChange} className="col-span-2 md:col-span-1" />
      <InputField label="Data Vistoria" name="data_vistoria" type="date" value={formData.data_vistoria} onChange={handleChange} className="col-span-2 md:col-span-1" />
      
      <div className="col-span-4 mt-4 p-4 bg-blue-900/20 rounded-xl border border-blue-500/30 backdrop-blur-sm">
        <label className="block text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Status / Etapa Atual</label>
        <select 
          name="status" 
          value={formData.status} 
          onChange={handleChange} 
          className="block w-full rounded-lg border-blue-500/50 shadow-inner focus:border-blue-400 focus:ring-blue-500 py-2.5 px-3 text-sm bg-slate-900 text-blue-200 font-bold"
        >
          {PROJECT_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
      </div>

      {renderProjectTimeline()}
    </div>
  );

  return (
    <div className="bg-slate-900/80 backdrop-blur-md shadow-2xl rounded-2xl p-4 md:p-8 max-w-7xl mx-auto border border-white/10 relative min-h-[600px]">
      <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="text-3xl">{clienteEditando ? '✏️' : '👤'}</span>
        {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
      </h2>
      
      <form onSubmit={handleSubmit} noValidate>
        {renderTabs()}
        
        {currentStep === 1 && renderDadosPessoais()}
        {currentStep === 2 && renderInstalacao()}
        {currentStep === 3 && renderDocumentos()}
        {currentStep === 4 && renderProjeto()}

        {/* BARRA FLUTUANTE DE BOTÕES */}
        <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur border-t border-white/10 p-4 z-[80] flex justify-center shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
           <div className="flex gap-4 w-full max-w-4xl justify-between items-center">
              <button type="button" onClick={onCancel} className="px-8 py-3 bg-slate-800 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide">
                CANCELAR
              </button>
              
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-8 py-3 bg-slate-800 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide">
                    VOLTAR
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all text-sm font-bold uppercase tracking-wide">
                    PRÓXIMO
                  </button>
                ) : (
                  <button 
                    type="button" // Importante: ser type="button" para controlar o clique
                    onClick={handleSubmit} // Chama o submit manualmente
                    disabled={loading} 
                    className="px-10 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 hover:shadow-[0_0_15px_rgba(22,163,74,0.5)] transition-all text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {loading ? 'SALVANDO...' : (saveMessage || 'SALVAR CLIENTE')}
                  </button>
                )}
              </div>
           </div>
        </div>

      </form>
    </div>
  );
};
