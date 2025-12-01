package com.example.pedidos.Services;

import com.example.pedidos.Models.Cliente;
import com.example.pedidos.Repositories.ClienteRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public Cliente cadastrarCliente(Cliente cliente) {
        if (clienteRepository.existsByTelefone(cliente.getTelefone())) {
            throw new DataIntegrityViolationException("Já existe um cliente com esse telefone");
        }
        return clienteRepository.save(cliente);
    }

    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    public Cliente buscarCliente(Long id) {
        return clienteRepository.findById(id).orElse(null);
    }

    public Cliente atualizarCliente(Long id, Cliente clienteAtualizado) {
        Cliente cliente = clienteRepository.findById(id).orElse(null);
        if (clienteRepository.existsByTelefoneAndIdNot(clienteAtualizado.getTelefone(), id)
        ) {
            throw new DataIntegrityViolationException("Já existe outro cliente com esse telefone.");
        }
        if (cliente != null) {
            cliente.setNome(clienteAtualizado.getNome());
            cliente.setTelefone(clienteAtualizado.getTelefone());
            cliente.setEndereco(clienteAtualizado.getEndereco());
            cliente.setData(clienteAtualizado.getData());
            return clienteRepository.save(cliente);
        } else {
            throw new RuntimeException("Cliente não encontrado com id: " + id);
        }
    }

    public void excluirCliente(Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new RuntimeException("Cliente não encontrado com id: " + id);
        }
        clienteRepository.deleteById(id);
    }
}