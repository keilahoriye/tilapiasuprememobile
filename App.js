import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { loginUser } from './src/services/api';
import HomeScreen from './src/screens/HomeScreen';
import NovoPedidoScreen from './src/screens/NovoPedidoScreen';
import PedidosScreen from './src/screens/PedidosScreen';

const Stack = createNativeStackNavigator();


// LOGIN SCREEN (COMPONENTE PRINCIPAL)
function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);

        const result = await loginUser(email, senha);

        setLoading(false);

        if (result.success) {
            navigation.navigate("Home", { user: result.user });

        } else {
            Alert.alert("Erro de Login", result.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Faça seu login</Text>

                <TextInput 
                    placeholder="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    placeholderTextColor="#666"
                />

                <TextInput 
                    placeholder="Senha"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    style={styles.input}
                    placeholderTextColor="#666"
                />

                <Button 
                    title="Entrar"
                    onPress={handleLogin}
                    disabled={loading}
                />

                {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
            </View>
        </SafeAreaView>
    );
}

// APP PRINCIPAL
export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="NovoPedido" component={NovoPedidoScreen} /> 
                    <Stack.Screen name="Pedidos" component={PedidosScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

// STYLESHEET
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 15,
        marginBottom: 20,
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
        color: '#000'
    },
    loader: {
        marginTop: 20,
    }
});