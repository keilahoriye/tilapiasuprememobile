import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker'; 

import { cadastrarPedidoMobile, updatePedido, getProdutos } from '../services/api'; 

// Componente de Item Simples (Produto Disponível)
const ProdutoItem = ({ item, onAdicionar }) => (
    <View style={itemStyles.itemRow}>
        <View style={itemStyles.textContainer}>
            <Text style={itemStyles.descricao}>{item.descricao}</Text>
            <Text style={itemStyles.preco}>R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
        </View>
        <TouchableOpacity style={itemStyles.addButton} onPress={() => onAdicionar(item)}>
            <Text style={itemStyles.addButtonText}>+</Text>
        </TouchableOpacity>
    </View>
);

// TELA PRINCIPAL
export default function NovoPedidoScreen({ navigation }) {
    const route = useRoute();
    const pedidoParaEditar = route.params?.pedidoParaEditar;

    // ESTADOS DE DADOS
    const [clienteId, setClienteId] = useState(null);
    const [pedidoId, setPedidoId] = useState(null);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');

    const [dataEntrega, setDataEntrega] = useState(new Date()); 
    const [showDateModal, setShowDateModal] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    const [taxaEntrega, setTaxaEntrega] = useState(''); 
    
    const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    
    // ESTADOS DE INTERFACE
    const [loading, setLoading] = useState(false);
    const [calculando, setCalculando] = useState(false);
    const [produtosLoading, setProdutosLoading] = useState(true);

    // BUSCA DE PRODUTOS
    const fetchProdutos = useCallback(async () => {
        setProdutosLoading(true);
        const result = await getProdutos();
        if (result.success) {
            setProdutosDisponiveis(result.data);
            setProdutosLoading(false);
            return result.data;
        } else {
            Alert.alert("Erro", result.message || "Falha ao carregar produtos.");
            setProdutosLoading(false);
            return [];
        }
    }, []);

    // EFEITO DE INICIALIZAÇÃO
    useEffect(() => {
        const initialize = async () => {
            const produtos = await fetchProdutos(); 

            if (pedidoParaEditar && produtos.length > 0) {
                // --- MODO EDIÇÃO ---
                navigation.setOptions({ title: 'Editar Pedido' });
                
                // 1. Dados Básicos e ID
                setPedidoId(pedidoParaEditar.id);

                const cliente = pedidoParaEditar.cliente || {};
                setClienteId(pedidoParaEditar.clienteId || cliente.id || null);

                setNome(pedidoParaEditar.nomeCliente || pedidoParaEditar.nome || cliente.nome || '');
                setTelefone(pedidoParaEditar.telefone || cliente.telefone || '');
                setEndereco(pedidoParaEditar.endereco || cliente.endereco || '');
                
                // 2. Data
                const apiDate = new Date(pedidoParaEditar.dataEntrega); 
                if (!isNaN(apiDate.getTime())) {
                    setDataEntrega(apiDate);
                    setTempDate(apiDate);
                }
                
                // 3. Taxa de Entrega
                if (pedidoParaEditar.taxaEntrega !== undefined && pedidoParaEditar.taxaEntrega !== null) {
                    setTaxaEntrega(String(pedidoParaEditar.taxaEntrega).replace('.', ','));
                } else {
                    setTaxaEntrega('');
                }
                
                // 4. Carrinho
                const itensPedido = pedidoParaEditar.itens || [];

                const carrinhoInicial = pedidoParaEditar.itens.map(apiItem => {
                    const produtoInfo = produtos.find(p => String(p.codigo) === String(apiItem.produto));

                    return {
                        codigo: apiItem.produto,
                        quantidade: apiItem.quantidade,
                        preco: apiItem.precoUnitario || produtoInfo?.preco || 0, 
                        descricao: apiItem.descricao || produtoInfo?.descricao || 'Item Desconhecido'
                    };
                });
                setCarrinho(carrinhoInicial);
                
            } else {
                // --- MODO CRIAÇÃO ---
                navigation.setOptions({ title: 'Novo Pedido' });
                setPedidoId(null);
            }
        };

        initialize();
    }, [pedidoParaEditar, navigation, fetchProdutos]);

    // LÓGICA DO DATE PICKER
    const onChangeDate = (event, selectedDate) => {
        // ... (Mantida)
        const currentDate = selectedDate || dataEntrega;
        if (event.type === 'dismissed') return;
        setDataEntrega(currentDate);
        if (event.type === 'set') setShowDateModal(false);
    };

    const displayDate = dataEntrega.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // LÓGICA DO CARRINHO
    const adicionarItem = (produto) => {
        const itemExistente = carrinho.find(item => item.codigo === produto.codigo);

        if (itemExistente) {
            setCarrinho(carrinho.map(item =>
                item.codigo === produto.codigo
                    ? { ...item, quantidade: item.quantidade + 1 }
                    : item
            ));
        } else {
            setCarrinho([...carrinho, { 
                codigo: produto.codigo, 
                quantidade: 1, 
                preco: produto.preco, 
                descricao: produto.descricao 
            }]);
        }
    };
    
    const removerItem = (codigo) => {
        // ... (Mantida)
        const item = carrinho.find(item => item.codigo === codigo);
        if (!item) return;

        if (item.quantidade > 1) {
            setCarrinho(carrinho.map(i =>
                i.codigo === codigo ? { ...i, quantidade: i.quantidade - 1 } : i
            ));
        } else {
            setCarrinho(carrinho.filter(i => i.codigo !== codigo));
        }
    };

    // CÁLCULO TOTAL
    const valorPedido = useMemo(() => {
        return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    }, [carrinho]);

    const calcularTotalPedido = () => {
        setCalculando(true);
        // Usa o estado rawTaxa para o cálculo
        const taxaRaw = taxaEntrega.replace('R$', '').trim().replace(',', '.') || '0';
        const taxa = parseFloat(taxaRaw);
        const total = valorPedido + taxa;
        
        setTimeout(() => {
            Alert.alert(
                "Valor Final do Pedido",
                `Itens: R$ ${valorPedido.toFixed(2).replace('.', ',')}\nTaxa: R$ ${taxa.toFixed(2).replace('.', ',')}\n\nTOTAL: R$ ${total.toFixed(2).replace('.', ',')}`
            );
            setCalculando(false);
        }, 300);
    };

    // FUNÇÃO DE ENVIO PARA API (CREATE/UPDATE)
    const handleSalvarPedido = async () => {
        if (!nome || !telefone || !endereco || !dataEntrega || carrinho.length === 0) {
            Alert.alert("Erro", "Preencha todos os dados e adicione itens ao pedido.");
            return;
        }

        setLoading(true);
        
        const taxaRaw = taxaEntrega.replace('R$', '').trim().replace(',', '.') || '0';
        const taxaNumerica = parseFloat(taxaRaw);
        
        const dataFormatadaISO = dataEntrega.toISOString().substring(0, 19); 
        
        const pedidoParaEnvio = pedidoId
            ? {   // ----------------- MODO EDIÇÃO (PUT) -----------------
                id: pedidoId,

                cliente: {
                    id: clienteId || null,
                    nome: nome,
                    telefone: telefone,
                    endereco: endereco
                },

                dataEntrega: dataFormatadaISO,
                taxaEntrega: taxaNumerica,

                itens: carrinho.map(item => ({
                    produto: item.codigo,
                    quantidade: item.quantidade,
                    precoUnitario: item.preco
                }))
            }
            : {   // ----------------- MODO CRIAÇÃO (POST) -----------------
                nome: nome,
                telefone: telefone,
                endereco: endereco,

                dataEntrega: dataFormatadaISO,
                taxaEntrega: taxaNumerica,

                itens: carrinho.map(item => ({
                    produto: item.codigo,
                    quantidade: item.quantidade,
                    precoUnitario: item.preco
                }))
            };


        
        let result;
        const operacao = pedidoId ? 'atualizado' : 'cadastrado';

        console.log("PEDIDO DTO ENVIADO:", JSON.stringify(pedidoParaEnvio, null, 2));

        try {
            if (pedidoId) {
                // MODO EDIÇÃO
                console.log("ID ENVIADO PARA PUT:", pedidoId);
                result = await updatePedido(pedidoId, pedidoParaEnvio); 
            } else {
                // MODO CRIAÇÃO
                result = await cadastrarPedidoMobile(pedidoParaEnvio);
            }
            
            if (result.success) {
                Alert.alert("Sucesso", `Pedido ${operacao} com sucesso!`);
                navigation.navigate('Pedidos');
            } else {
                Alert.alert("Erro", result.message || `Falha ao ${operacao} o pedido.`);
            }

        } catch (error) {
            console.error("Erro na operação:", error);
            Alert.alert("Erro de Conexão", `Não foi possível ${operacao} o pedido no servidor.`);
        } finally {
            setLoading(false);
        }
    };

    // UI (Interface do Usuário)
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>{pedidoParaEditar ? 'Editar Pedido' : 'Novo Pedido'}</Text>
                
                {/* 1. DADOS DO CLIENTE */}
                <Text style={styles.subtitle}>Dados do Cliente</Text>
                <TextInput 
                    placeholder="Nome do Cliente" value={nome} onChangeText={setNome} style={styles.input} placeholderTextColor="#666" />
                <TextInput 
                    placeholder="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" style={styles.input} placeholderTextColor="#666" />
                <TextInput 
                    placeholder="Endereço de Entrega" value={endereco} onChangeText={setEndereco} style={styles.input} placeholderTextColor="#666" />
                
                {/* 2. DADOS DA ENTREGA */}
                <Text style={styles.subtitle}>Data e Taxa de Entrega</Text>
                
                <TouchableOpacity onPress={() => setShowDateModal(true)} style={styles.dateDisplay}>
                    <Text style={styles.dateDisplayText}>🗓️ Data/Hora: {displayDate}</Text>
                </TouchableOpacity>

                {/* MODAL DATE TIME PICKER */}
                {showDateModal && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.headerButton}>
                                    <Text style={styles.headerButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.headerButton}
                                    onPress={() => {
                                        setDataEntrega(tempDate);
                                        setShowDateModal(false);
                                    }}
                                >
                                    <Text style={[styles.headerButtonText, { color: '#007AFF', fontWeight: 'bold' }]}>Concluído</Text>
                                </TouchableOpacity>
                            </View>

                            <DateTimePicker
                                value={tempDate}
                                mode="datetime"
                                display="spinner"
                                is24Hour={true}
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) setTempDate(selectedDate);
                                }}
                            />
                        </View>
                    </View>
                )}
                
                <TextInput 
                    placeholder="R$ Taxa de Entrega" 
                    value={taxaEntrega ? `R$ ${taxaEntrega}` : ''} 
                    onChangeText={(text) => {
                        const numericValue = text.replace(/[^0-9,.]/g, ''); 
                        setTaxaEntrega(numericValue); 
                    }}
                    keyboardType="numeric" 
                    style={styles.input} 
                    placeholderTextColor="#666" 
                />

                {/* 3. SELEÇÃO DE PRODUTOS */}
                <Text style={styles.subtitle}>Produtos Disponíveis</Text>
                {produtosLoading ? (
                    <ActivityIndicator size="large" color="#001A4E" style={{ marginVertical: 20 }} />
                ) : produtosDisponiveis.length === 0 ? (
                    <Text>Nenhum produto encontrado.</Text>
                ) : (
                    produtosDisponiveis.map(produto => (
                        <ProdutoItem key={produto.codigo} item={produto} onAdicionar={adicionarItem} />
                    ))
                )}
                
                {/* 4. CARRINHO ATUAL */}
                <Text style={styles.subtitle}>Carrinho (R$ {valorPedido.toFixed(2).replace('.', ',')})</Text>
                {carrinho.map(item => (
                    <View key={item.codigo} style={styles.carrinhoRow}>
                        <Text style={styles.carrinhoText}>{item.descricao}</Text>
                        <View style={styles.carrinhoBotoes}>
                            <TouchableOpacity onPress={() => removerItem(item.codigo)} style={styles.carrinhoBtn}>
                                <Text style={styles.carrinhoBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.carrinhoQtd}>{item.quantidade}</Text>
                            <TouchableOpacity onPress={() => adicionarItem(item)} style={styles.carrinhoBtn}>
                                <Text style={styles.carrinhoBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}


                {/* 5. BOTÕES DE AÇÃO */}
                <TouchableOpacity 
                    style={styles.calcularButton} 
                    onPress={calcularTotalPedido}
                    disabled={calculando}>
                    <Text style={styles.calcularButtonText}>
                        {calculando ? 'Calculando...' : 'CALCULAR VALOR TOTAL'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSalvarPedido}
                    disabled={loading}>
                    <Text style={styles.saveButtonText}>
                        {loading ? 'Salvando...' : `SALVAR ${pedidoParaEditar ? 'EDIÇÃO' : 'PEDIDO'}`}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

// ESTILOS
const itemStyles = StyleSheet.create({
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 5,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    textContainer: {
        flex: 1,
    },
    descricao: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    preco: {
        fontSize: 14,
        color: '#666',
    },
    addButton: {
        backgroundColor: '#001A4E',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { padding: 20, paddingBottom: 50 },
    
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#001A4E' },
    subtitle: { fontSize: 18, fontWeight: '600', marginTop: 15, marginBottom: 10, color: '#001A4E' },

    input: {
        borderWidth: 1,
        borderColor: '#C1D9E7',
        padding: 12,
        marginBottom: 10,
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
        color: '#000'
    },
    
    // Estilos do Date Picker
    dateDisplay: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#C1D9E7',
        marginBottom: 10,
        alignItems: 'center',
    },
    dateDisplayText: {
        fontSize: 16,
        color: '#001A4E',
        fontWeight: '500'
    },
    
    modalView: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9', 
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    headerButton: {
        padding: 5,
    },
    headerButtonText: {
        fontSize: 17,
        color: '#333',
    },
    
    // Estilos do Carrinho
    carrinhoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    carrinhoText: { fontSize: 16, color: '#333', flex: 1 },
    carrinhoBotoes: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 90,
    },
    carrinhoBtn: {
        backgroundColor: '#E6E9F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginHorizontal: 5,
    },
    carrinhoBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#001A4E',
    },
    carrinhoQtd: {
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Botão Calcular
    calcularButton: {
        backgroundColor: '#C1D9E7',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    calcularButtonText: {
        color: '#001A4E',
        fontWeight: 'bold',
        fontSize: 18,
    },
    
    // Botão Finalizar
    saveButton: {
        backgroundColor: '#001A4E', 
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    
    // Botão Voltar
    backButton: {
        marginTop: 20,
        alignItems: 'center'
    },
    backButtonText: {
        color: '#FF6347',
        fontSize: 16,
    }
});