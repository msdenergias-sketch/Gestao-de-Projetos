
import { Cliente, Servico, Despesa, Anexo } from '../types';

const STORAGE_KEY_CLIENTES = 'sgs_clientes';
const STORAGE_KEY_SERVICOS = 'sgs_servicos';
const STORAGE_KEY_DESPESAS = 'sgs_despesas';

// Helper to mimic delay (Reduced for save/read, removed for delete)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const StorageService = {
  // --- Clientes ---
  getClientes: async (): Promise<Cliente[]> => {
    await delay(50); // Pequeno delay apenas para simular leitura assíncrona
    const data = localStorage.getItem(STORAGE_KEY_CLIENTES);
    return data ? JSON.parse(data) : [];
  },

  saveCliente: async (cliente: Cliente): Promise<Cliente> => {
    await delay(150);
    const clientes = await StorageService.getClientes();
    const index = clientes.findIndex(c => c.id === cliente.id);
    
    if (index >= 0) {
      clientes[index] = cliente;
    } else {
      clientes.push(cliente);
    }
    
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        throw new Error("LIMITE_ATINGIDO");
      }
      throw e;
    }
    return cliente;
  },

  deleteCliente: async (id: string): Promise<void> => {
    // Sem delay para garantir execução imediata
    const data = localStorage.getItem(STORAGE_KEY_CLIENTES);
    const clientes: Cliente[] = data ? JSON.parse(data) : [];
    
    const filtered = clientes.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(filtered));
  },

  // --- Serviços ---
  getServicos: async (): Promise<Servico[]> => {
    await delay(50);
    const data = localStorage.getItem(STORAGE_KEY_SERVICOS);
    return data ? JSON.parse(data) : [];
  },

  saveServico: async (servico: Servico): Promise<Servico> => {
    await delay(150);
    const servicos = await StorageService.getServicos();
    const index = servicos.findIndex(s => s.id === servico.id);
    
    if (index >= 0) {
      servicos[index] = servico;
    } else {
      servicos.push(servico);
    }
    
    localStorage.setItem(STORAGE_KEY_SERVICOS, JSON.stringify(servicos));
    return servico;
  },

  deleteServico: async (id: string): Promise<void> => {
    // Sem delay
    const data = localStorage.getItem(STORAGE_KEY_SERVICOS);
    const servicos: Servico[] = data ? JSON.parse(data) : [];
    const filtered = servicos.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SERVICOS, JSON.stringify(filtered));
  },

  // --- Despesas ---
  getDespesas: async (): Promise<Despesa[]> => {
    await delay(50);
    const data = localStorage.getItem(STORAGE_KEY_DESPESAS);
    return data ? JSON.parse(data) : [];
  },

  saveDespesa: async (despesa: Despesa): Promise<Despesa> => {
    await delay(150);
    const despesas = await StorageService.getDespesas();
    const index = despesas.findIndex(d => d.id === despesa.id);
    
    if (index >= 0) {
      despesas[index] = despesa;
    } else {
      despesas.push(despesa);
    }
    
    localStorage.setItem(STORAGE_KEY_DESPESAS, JSON.stringify(despesas));
    return despesa;
  },

  deleteDespesa: async (id: string): Promise<void> => {
    // Sem delay
    const data = localStorage.getItem(STORAGE_KEY_DESPESAS);
    const despesas: Despesa[] = data ? JSON.parse(data) : [];
    const filtered = despesas.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY_DESPESAS, JSON.stringify(filtered));
  },

  // --- Utils ---
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Se for PDF ou não for imagem, converte normal
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        return;
      }

      // Se for imagem, vamos comprimir drasticamente para economizar LocalStorage
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionar agressivo (Max 800px)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Comprimir JPEG qualidade 0.5
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = error => reject(error);
    });
  }
};
