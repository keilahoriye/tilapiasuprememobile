import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('../../assets/logo.jpg');

export default function HomeScreen({ route, navigation }) {
    const { user } = route.params;

    const handleLogout = () => {
        navigation.popToTop(); 
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>
                    Olá, {user.nome || 'Usuário'}!
                </Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                     <Text style={styles.logoutText}>Sair</Text>
                 </TouchableOpacity>
            </View>

            <View style={styles.menuContainer}>
                <Image 
                    source={logo} 
                    style={styles.logo}
                />
                <Text style={styles.menuTitle}>O que você deseja fazer?</Text>

                {/* BOTÃO NOVO PEDIDO */}
                <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => navigation.navigate('NovoPedido')}>
                    <Text style={styles.menuText}>Novo Pedido</Text>
                </TouchableOpacity>

                {/* BOTÃO LISTAGEM DE PEDIDOS */}
                <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => navigation.navigate('Pedidos')}>
                    <Text style={styles.menuText}>Ver Pedidos</Text>
                </TouchableOpacity>
                
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    logoutButton: {
        padding: 5,
    },
    logoutText: {
        color: '#FF6347',
        fontWeight: 'bold',
    },
    
    menuContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    logo: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
        marginBottom: 30,
    },

    menuTitle: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 30,
        color: '#333',
    },
    menuItem: {
        backgroundColor: '#00244E',
        padding: 15,
        borderRadius: 10,
        width: '90%',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    menuText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffffff',
    },
});