import axios from 'axios';

const BASE_URL = 'http://192.168.15.8:8080/api'; 

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Função de Login (POST para /api/auth/login)
export const loginUser = async (email, senha) => {
    try {
        const response = await api.post(`/auth/login`, {
            email: email,
            senha: senha,
        });

        return { success: true, user: response.data };

    } catch (error) {
        if (error.response && error.response.status === 401) {
            const errorMessage = error.response.data.error; 
            return { success: false, message: errorMessage || 'E-mail ou senha inválidos.' };
        }
        
        console.error('Erro de conexão:', error);
        return { success: false, message: 'Erro ao conectar com o servidor. Verifique a URL' };
    }
};

// LISTAR PEDIDOS RÁPIDO (SEM ITENS)
export const getPedidosResumo = async () => {
    try {
        const response = await api.get('/pedidos');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: "Erro ao buscar pedidos" };
    }
};

// FUNÇÃO PARA LISTAR TODOS OS PEDIDOS (GET para /api/pedidos)
export const getTodosPedidos = async (filters = {}) => {
    try {
        let url = '/pedidos/buscar';
        const params = [];

        if (filters.nome) {
            params.push(`cliente=${encodeURIComponent(filters.nome)}`);
        }
        if (filters.telefone) {
            params.push(`telefone=${encodeURIComponent(filters.telefone)}`);
        }
        if (filters.dataInicial) {
            params.push(`inicio=${filters.dataInicial}`);
        }
        if (filters.dataFinal) {
            params.push(`fim=${filters.dataFinal}`);
        }
        if (filters.item) {
            params.push(`produto=${encodeURIComponent(filters.item)}`);
        }

        if (params.length > 0) {
            url = `/pedidos/buscar?${params.join('&')}`;
        }
        
        const response = await api.get(url); 
        
        return { success: true, data: response.data }; 
    } catch (error) {
        if (error.response) {
            console.error('Erro HTTP ao buscar pedidos:', error.response.data);
            const errorMessage = error.response.data.message || 'Falha ao buscar pedidos no servidor.';
            return { success: false, message: errorMessage };
        }
        
        console.error('Erro de conexão:', error);
        return { success: false, message: 'Erro ao conectar com o servidor para buscar pedidos.' };
    }
};

// Listar produtos do Enum
export const getProdutos = async () => {
    try {
        const response = await api.get('/produtos');
        return { success: true, data: response.data }; 
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        return { success: false, message: 'Falha ao buscar produtos da API.' };
    }
};

// CADASTRAR PEDIDO MOBILE
export const cadastrarPedidoMobile = async (pedidoDTO) => {
    try {
        const response = await api.post('/pedidos/mobile', pedidoDTO);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Erro ao cadastrar pedido mobile:", error);
        return { success: false, message: 'Erro ao cadastrar pedido.' };
    }
};

export async function getItensDoPedido(pedidoId) {
    try {
        const response = await api.put(`/pedidos/${pedidoId}`, dadosDoPedido);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("Erro ao carregar itens do pedido:", error);
        return { success: false, message: "Erro ao carregar itens." };
    }
}

/**
 * Função para atualizar um pedido existente.
 * @param {string | number} pedidoId - O ID do pedido a ser atualizado.
 * @param {object} dadosDoPedido - Os novos dados do pedido.
 */
export async function updatePedido(pedidoId, dadosDoPedido) {
    console.log("PAYLOAD ENVIADO NO PUT:", JSON.stringify(dadosDoPedido, null, 2));

    if (!pedidoId) {
        return { success: false, message: "ID do pedido não fornecido para atualização." };
    }

    try {
        const response = await api.put(`/pedidos/${pedidoId}`, dadosDoPedido);
        return { success: true, data: response.data };

    } catch (error) {
        console.error("Erro na requisição PUT:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Erro de conexão ao atualizar pedido." 
        };
    }
}

/**
 * Função para deletar um pedido específico pelo ID.
 * @param {string | number} pedidoId - O ID do pedido a ser deletado.
 */
export async function deletePedido(pedidoId) {
    if (!pedidoId) {
        return { success: false, message: "ID do pedido não fornecido." };
    }

    try {
        const response = await api.delete(`/pedidos/${pedidoId}`);
        return { success: true, data: response.data };
    
    } catch (error) {
        console.error("Erro na requisição DELETE:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || "Erro de conexão ao deletar pedido." 
        };
    }
}

export default api;