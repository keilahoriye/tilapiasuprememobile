import React, { useState, useEffect, useCallback } from 'react';
import { View, Keyboard, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { getTodosPedidos } from '../services/api'; 
const deletePedido = async (id) => {
    console.log(`Simulando exclusão do pedido ID: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true }; 
};

// Lista de Produtos Disponíveis (Chave:Nome)
const PRODUTOS_DISPONIVEIS = [
    { nome: "Filé de Tilápia - 1kg", key: "FILE" },
    { nome: "Filé de Tilápia - 500g", key: "MEIOFILE" },
    { nome: "Filé de Tilápia em tiras", key: "TIRAS" },
    { nome: "Costelinha de Tilápia", key: "COSTELINHA" },
    { nome: "Tilápia inteira espalmada", key: "ESPALMADA" },
    { nome: "Empanadinho de Tilápia", key: "EMPANADINHO" },
    { nome: "Filé + Tiras", key: "COMBO" },
    { nome: "Tempero Supreme", key: "TEMPERO" },
];

// Função Auxiliar para Mapear Chave para Nome
const getProdutoNomeByKey = (key) => {
    const produto = PRODUTOS_DISPONIVEIS.find(p => p.key === key);
    return produto ? produto.nome : key;
};

const formatTelefone = (tel) => {
    if (!tel) return 'Telefone Não Informado';
    const digits = tel.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6, 10)}`;
    }
    if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
    }
    return tel; 
};


// Componente de Item da Lista
const PedidoItem = ({ pedido, onEdit, onDelete, onDetails }) => {
    if (!pedido || typeof pedido !== 'object') {
        console.log("❌ Pedido inválido recebido:", pedido);
        return null;
    }

    if (!pedido) return null;

    const cliente = {
        nome: pedido.nomeCliente ?? "Cliente não informado",
        telefone: pedido.telefone ?? "",
        endereco: pedido.endereco ?? ""
    };

    // Formata a data de entrega
    const dataEntrega = new Date(pedido.dataEntrega).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const itens = Array.isArray(pedido?.itens) ? pedido.itens : [];

    // PedidoItem
    const valorItens = itens.reduce((total, item) => {
        return total + (Number(item.quantidade || 0) * Number(item.precoUnitario || 0));
    }, 0);

    const taxaEntrega = Number(pedido.taxaEntrega || 0); 
    const valorTotal = valorItens + taxaEntrega;

    const dataEntregaMs = new Date(pedido.dataEntrega).getTime();
    const agoraMs = new Date().getTime();

    const isConcluido = dataEntregaMs <= agoraMs; 
    const statusDisplay = isConcluido ? '🟢 ENTREGUE' : '🟡 PENDENTE';


    return (
    <TouchableOpacity 
        style={styles.itemContainer} 
        onPress={onDetails}
    >

        {/* CABEÇALHO: Nome e Status */}
        <View style={styles.headerRow}>
            <Text style={styles.clienteNome}>{cliente.nome}</Text>
            <Text style={styles.statusText}>
                {statusDisplay}
            </Text>
        </View>

        {/* TELEFONE */}
        <Text style={styles.clienteTelefone}>
            {formatTelefone(cliente.telefone)}
        </Text>

        {/* ENTREGA */}
        <Text style={styles.dataEntrega}>Entrega: {dataEntrega}</Text>

        {/* ENDEREÇO */}
        <Text style={styles.endereco}>Endereço: {cliente.endereco}</Text>

        {/* ÁREA DE DETALHES */}
        <View style={styles.itensListContainer}>
            <Text style={styles.itensTitle}>Clique para ver detalhes do pedido</Text>
        </View>        

        {/* BOTÕES */}
        <View style={styles.actionButtonsInline}>
            <TouchableOpacity 
                style={styles.editButton}
                onPress={(e) => {
                    e.stopPropagation();
                    onEdit(pedido);
                }}
            >
                <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.deleteButton, { marginLeft: 8 }]} 
                onPress={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                <Text style={styles.deleteButtonText}>Deletar</Text>
            </TouchableOpacity>
        </View>

    </TouchableOpacity>
);
};

// TELA PRINCIPAL
export default function PedidosScreen({ navigation }) {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false); 

    const [filterNome, setFilterNome] = useState('');
    const [filterTelefone, setFilterTelefone] = useState('');
    const [filterItem, setFilterItem] = useState(''); 
    const [filterDataInicial, setFilterDataInicial] = useState(null);
    const [filterDataFinal, setFilterDataFinal] = useState(null);
    const [searchTrigger, setSearchTrigger] = useState(0); 

    const [showDatePickerModal, setShowDatePickerModal] = useState(false); 
    const [datePickerMode, setDatePickerMode] = useState('inicial'); 
    const [tempDate, setTempDate] = useState(new Date());

    const [isProductPickerVisible, setIsProductPickerVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
    const [itensDetalhes, setItensDetalhes] = useState([]);
    const [loadingItens, setLoadingItens] = useState(false);
    const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);


// LÓGICA DE MODAL DE DETALHES E BUSCA DE ITENS
    const fetchItens = async (pedidoId) => { 
        setLoadingItens(true);
        setItensDetalhes([]); 

        try {
            const response = await fetch(`http://192.168.15.8:8080/api/pedidos/${pedidoId}/itens`);
            const dados = await response.json();
            setItensDetalhes(dados); 
            console.log("Itens recebidos:", dados);

        } catch (e) {
            console.log("Erro ao carregar itens", e);
            Alert.alert("Erro de Detalhes", "Não foi possível carregar os itens deste pedido.");
        } finally {
            setLoadingItens(false);
        }
    };

    const handleShowDetails = (pedido) => { 
        setPedidoSelecionado(pedido);
        setModalDetalhesVisible(true);
        fetchItens(pedido.id);
    };

    const closeModalDetalhes = () => {
        setModalDetalhesVisible(false);
        setPedidoSelecionado(null);
        setItensDetalhes([]);
    };

    // LÓGICA DE BUSCA DE DADOS
    const fetchPedidos = async () => {
        const setLoad = isRefreshing ? setIsRefreshing : setLoading;
        if (loading && !isRefreshing) return;

        setLoad(true);

        const filters = {
            nome: filterNome,
            telefone: filterTelefone,
            item: filterItem ? filterItem.toUpperCase() : null, 
            dataInicial: filterDataInicial ? filterDataInicial.toISOString() : null,
            dataFinal: filterDataFinal ? filterDataFinal.toISOString() : null,
        };
        
        try {
            const result = await getTodosPedidos(filters);

            if (result.success) {
                const pedidosOrdenados = [...result.data].sort((a, b) => {
                    const dataA = new Date(a.dataEntrega);
                    const dataB = new Date(b.dataEntrega);

                    return dataB - dataA; 
                });
                setPedidos(pedidosOrdenados);
                
                result.data.forEach((p, index) => {
                    if (!p) {
                        console.log("Pedido undefined no índice:", index);
                    } else if (!("itens" in p)) {
                        console.log("Pedido sem itens:", p);
                    }
                });

                if (result.data && result.data.length > 0) {
                    console.log("--- DADOS DO PRIMEIRO PEDIDO ---");
                    console.log(result.data[0]);
                    console.log(result.data[0].itens || []);
                }

            } else {
                Alert.alert("Erro ao Carregar", result.message || "Não foi possível carregar os pedidos.");
                setPedidos([]);
            }
        } catch (error) {
            console.error("Erro na API:", error);
            Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor.");
            setPedidos([]);
        } finally {
            setLoad(false);
        }
    };

    // EFEITO DE BUSCA
    useEffect(() => {
        if (searchTrigger > 0) { 
            fetchPedidos();
        }
    }, [searchTrigger]); 

    useFocusEffect(
        useCallback(() => {
            fetchPedidos(); 
        }, []) 
    );

    const clearFilters = () => {
        setFilterNome('');
        setFilterTelefone('');
        setFilterItem('');
        setSelectedProduct(null); 
        setFilterDataInicial(null);
        setFilterDataFinal(null);
        setSearchTrigger(prev => prev + 1); 
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setSearchTrigger(prev => prev + 1);
    };
    
    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePickerModal(false); 
            if ((event.type === 'set' || event.type === 'end-editing') && selectedDate) {
                if (datePickerMode === 'inicial') {
                    setFilterDataInicial(selectedDate);
                } else {
                    setFilterDataFinal(selectedDate);
                }
            }
        } else {
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };
    
    const showDatePicker = (mode) => {
        const initialDate = mode === 'inicial' ? filterDataInicial : filterDataFinal;
        
        setDatePickerMode(mode);
        setTempDate(initialDate || new Date());
    
        if (Platform.OS === 'android') {            
            setShowDatePickerModal(true);
            
        } else {
            setShowDatePickerModal(true);
        }
    };

    const handleConfirmIOSDate = () => {
        const finalDate = tempDate; 

        if (datePickerMode === 'inicial') {
            setFilterDataInicial(finalDate);
        } else {
            setFilterDataFinal(finalDate);
        }
        
        setShowDatePickerModal(false);
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setFilterItem(product.key);
        setIsProductPickerVisible(false);
    };

    const handleEditPedido = async (pedido) => {
        try {
            const res = await fetch(`http://192.168.15.8:8080/api/pedidos/${pedido.id}/itens`);
            const itens = await res.json();

            navigation.navigate('NovoPedido', { 
                pedidoParaEditar: { ...pedido, itens }
            });
        } catch (e) {
            Alert.alert("Erro", "Não foi possível carregar os itens para edição.");
        }
    };


    // Função para lidar com a exclusão
    const handleDeletePedido = (pedidoId) => () => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja deletar este pedido? Esta ação é irreversível.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Deletar", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const result = await deletePedido(pedidoId); 
                            
                            // *** Exemplo Simulado de Exclusão ***
                            console.log(`Deletando pedido ID: ${pedidoId}`);
                            
                            setPedidos(prevPedidos => prevPedidos.filter(p => p.id !== pedidoId));
                            
                            Alert.alert("Sucesso", "Pedido deletado com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível deletar o pedido. Tente novamente.");
                        }
                    } 
                },
            ]
        );
    };

    // RENDERIZAÇÃO
    if (loading && pedidos.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#001A4E" />
                <Text style={styles.loadingText}>Carregando pedidos...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Pedidos ({pedidos.length})</Text>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => navigation.navigate('NovoPedido')}>
                    <Text style={styles.addButtonText}>+ Novo Pedido</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                {/* Filtro de Nome */}
                <TextInput 
                    placeholder="Buscar por Nome do Cliente"
                    value={filterNome}
                    onChangeText={setFilterNome} 
                    style={styles.inputFilter}
                    placeholderTextColor="#666"
                />
                {/* Filtro de Telefone */}
                <TextInput 
                    placeholder="Buscar por Telefone"
                    value={filterTelefone}
                    onChangeText={setFilterTelefone}
                    keyboardType="phone-pad"
                    style={styles.inputFilter}
                    placeholderTextColor="#666"
                />
                {/* Campo de Seleção de Item (Seleção Única) */}
                <TouchableOpacity 
                    style={[styles.inputFilter, styles.pickerButton]} 
                    onPress={() => setIsProductPickerVisible(true)}
                >
                    <Text style={selectedProduct ? styles.pickerText : styles.pickerPlaceholder}>
                        {selectedProduct ? selectedProduct.nome : 'Buscar por Item do Pedido'}
                    </Text>
                </TouchableOpacity>

                {/* Filtros de Data */}
                <View style={styles.dateFilterRow}>
                    <TouchableOpacity 
                        style={styles.dateFilterButton} 
                        onPress={() => showDatePicker('inicial')}>
                        <Text style={styles.dateFilterText}>
                            De: {filterDataInicial ? filterDataInicial.toLocaleDateString('pt-BR') : 'Selecione'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.dateFilterButton}
                        onPress={() => showDatePicker('final')}>
                        <Text style={styles.dateFilterText}>
                            Até: {filterDataFinal ? filterDataFinal.toLocaleDateString('pt-BR') : 'Selecione'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Botões de Ação de Filtro */}
                <View style={styles.filterActionRow}> 
                    <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={clearFilters}>
                        <Text style={styles.clearButtonText}>Limpar Filtros</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.searchButton, { flex: 2, marginLeft: 10 }]} 
                        onPress={() => {
                            Keyboard.dismiss();
                            setSearchTrigger(prev => prev + 1);
                        }}>
                        <Text style={styles.searchButtonText}>Aplicar Filtros e Buscar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={pedidos}
                keyExtractor={(item, index) => (item?.id ? item.id.toString() : `sem-id-${index}`)}
                renderItem={({ item }) => (
                    <PedidoItem 
                        pedido={item}
                        onDetails={() => handleShowDetails(item)}
                        onEdit={handleEditPedido}
                        onDelete={handleDeletePedido(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}

                
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nenhum pedido encontrado com esse filtro.</Text>
                    </View>
                )}
            />

            {/* PICKER NATIVO iOS (SPINNER MODAL) */}
            {showDatePickerModal && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showDatePickerModal}
                    onRequestClose={() => setShowDatePickerModal(false)}
                >
                    <View style={styles.iosDatePickerContainer}>
                        <TouchableOpacity 
                            style={styles.iosDatePickerOverlay}
                            onPress={() => setShowDatePickerModal(false)} 
                        />
                        <View style={styles.iosDatePickerContent}>
                            <View style={styles.iosDatePickerToolbar}>
                                <TouchableOpacity onPress={handleConfirmIOSDate}>
                                    <Text style={styles.iosDatePickerDoneText}>Concluir</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <DateTimePicker
                                value={tempDate}
                                mode="date" 
                                display="spinner" 
                                is24Hour={true}
                                onChange={handleDateChange} 
                            />
                        </View>
                    </View>
                </Modal>
            )}
            
            {/* MODAL DE SELEÇÃO DE ITEM (Seleção Única) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isProductPickerVisible}
                onRequestClose={() => setIsProductPickerVisible(false)}
            >
                <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Selecione o Item</Text>
                        <FlatList
                            data={PRODUTOS_DISPONIVEIS}
                            keyExtractor={(item) => item.key}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem} 
                                    onPress={() => handleProductSelect(item)}
                                >
                                    <Text style={styles.modalItemText}>{item.nome}</Text>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                        />
                        <TouchableOpacity
                            style={[styles.clearButton, { marginTop: 15, width: '100%', flex: 0 }]}
                            onPress={() => setIsProductPickerVisible(false)}
                        >
                            <Text style={styles.clearButtonText}>Cancelar</Text> 
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        
            {/* MODAL DE DETALHES DO PEDIDO */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalDetalhesVisible} 
                onRequestClose={closeModalDetalhes}
            >
                <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Detalhes do Pedido</Text>

                        {pedidoSelecionado && (
                            <View style={styles.detailsContainer}>
                                <Text style={styles.detailText}><Text style={styles.detailLabel}>Cliente:</Text> {pedidoSelecionado.nomeCliente}</Text>
                                <Text style={styles.detailText}><Text style={styles.detailLabel}>Telefone:</Text> {formatTelefone(pedidoSelecionado.telefone)}</Text>
                                <Text style={styles.detailText}><Text style={styles.detailLabel}>Endereço:</Text> {pedidoSelecionado.endereco || 'Não Informado'}</Text>
                                <Text style={styles.detailText}><Text style={styles.detailLabel}>Entrega:</Text> {new Date(pedidoSelecionado.dataEntrega).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                                <Text style={[styles.detailText, { fontWeight: 'bold', marginTop: 10 }]}><Text style={styles.detailLabel}>Taxa de Entrega:</Text> R$ {pedidoSelecionado.taxaEntrega ? pedidoSelecionado.taxaEntrega.toFixed(2).replace('.', ',') : '0,00'}</Text>
                                
                                <Text style={styles.itensTitleModal}>Itens do Pedido</Text>

                                {loadingItens ? (
                                    <ActivityIndicator size="small" color="#001A4E" style={{ marginVertical: 10 }} />
                                ) : itensDetalhes.length > 0 ? (
                                    <FlatList
                                        data={itensDetalhes}
                                        keyExtractor={(item, index) => index.toString()}
                                        renderItem={({ item }) => (
                                            <View style={styles.itemRowModal}>
                                                <Text style={styles.itemQuantityModal}>{item.quantidade}x</Text>
                                                <Text style={styles.itemDescriptionModal}>{getProdutoNomeByKey(item.produto?.toUpperCase() || item.descricao?.toUpperCase())}</Text> 
                                                <Text style={styles.itemPriceModal}>R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}</Text>
                                            </View>
                                        )}
                                        ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                                        style={styles.flatListModal}
                                    />
                                ) : (
                                    <Text style={styles.detailText}>Nenhum item carregado para este pedido.</Text>
                                )}
                                
                                <Text style={[styles.detailText, styles.totalValue, { marginTop: 10, alignSelf: 'flex-end' }]}>
                                    Total Geral: R$ {(
                                        itensDetalhes.reduce((total, item) => total + Number(item.subtotal || 0), 0) 
                                        + (pedidoSelecionado.taxaEntrega || 0)
                                    ).toFixed(2).replace('.', ',')}
                                </Text>
                                
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.clearButton, { marginTop: 15, width: '100%', flex: 0, backgroundColor: '#001A4E' }]}
                            onPress={closeModalDetalhes}
                        >
                            <Text style={[styles.clearButtonText, { color: '#fff' }]}>Fechar</Text> 
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

// ESTILOS
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f7' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#001A4E' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#001A4E' 
    },
    addButton: {
        backgroundColor: '#001A4E',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    
    listContent: { 
        padding: 10 
    },
    
    // --- Estilos de Item e Filtros ---
    itemContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 5,
    },
    clienteNome: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    clienteTelefone: { 
        fontSize: 14, 
        color: '#001A4E', 
        fontWeight: '600',
        marginBottom: 5,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        alignSelf: 'flex-start',
    },
    dataEntrega: {
        fontSize: 14,
        color: '#555',
        marginBottom: 3,
        marginTop: 5,
    },
    endereco: {
        fontSize: 14,
        color: '#777',
        marginBottom: 10,
    },
    itensListContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
        marginBottom: 10,
    },
    itensTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
    },
    itemQuantity: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#001A4E',
        marginRight: 10,
    },
    itemDescription: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
        marginTop: 5,
    },
    actionButtonsInline: { 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 10,
        marginBottom: 10,
    },
    deleteButton: {
        backgroundColor: '#D93025',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    editButton: {
        backgroundColor: '#FFA500',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 5,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    actionButtons: { 
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    taxaEntrega: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500'
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#001A4E',
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        lineHeight: 24,
    },
    filterContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingTop: 10,
    },
    inputFilter: {
        borderWidth: 1,
        borderColor: '#C1D9E7',
        padding: 10,
        marginBottom: 8,
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
        color: '#000',
        fontSize: 14,
    },
    dateFilterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        zIndex: 1, 
    },
    dateFilterButton: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#C1D9E7',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    dateFilterText: {
        color: '#001A4E',
        fontSize: 14,
        fontWeight: '500'
    },
    filterActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 5,
    },
    searchButton: {
        backgroundColor: '#001A4E',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    clearButton: {
        flex: 1,
        backgroundColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pickerButton: {
    justifyContent: 'center',
    height: 44, 
    },
    pickerText: {
        color: '#000',
        fontSize: 14,
    },
    pickerPlaceholder: {
        color: '#666',
        fontSize: 14,
    },
    modalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 10,
        padding: 25,
        alignItems: "center",
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#001A4E'
    },
    modalItem: {
        paddingVertical: 10,
        width: '100%',
    },
    modalItemText: {
        fontSize: 16,
        color: '#333',
    },
    modalSeparator: {
        height: 1,
        backgroundColor: '#eee',
        width: '100%',
    },
    // --- Estilos do Modal de Detalhes ---
    detailsContainer: {
        width: '100%',
        paddingBottom: 10,
    },
    detailText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 3,
    },
    detailLabel: {
        fontWeight: 'bold',
        color: '#555',
    },
    itensTitleModal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#001A4E',
        marginTop: 15,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    itemRowModal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    itemQuantityModal: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#001A4E',
    },
    itemDescriptionModal: {
        fontSize: 15,
        color: '#333',
        flex: 1,
        paddingHorizontal: 10,
    },
    itemPriceModal: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    flatListModal: {
        width: '100%',
    },
    // --- Estilos de Picker iOS ---
    iosDatePickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },

    iosDatePickerContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.3)",
    },

    iosDatePickerContent: {
        backgroundColor: '#01163fff', 
        width: '100%',
    },

    iosDatePickerToolbar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    iosDatePickerDoneText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },

});