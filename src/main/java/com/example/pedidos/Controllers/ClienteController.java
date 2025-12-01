package com.example.pedidos.Controllers;

import com.example.pedidos.Models.Cliente;
import com.example.pedidos.Services.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    private final ClienteService clienteService;

    @Autowired
    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public ResponseEntity<List<Cliente>>listar() {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscar(@PathVariable Long id) {
        Cliente cliente = clienteService.buscarCliente(id);
        if (cliente != null) {
            return ResponseEntity.ok(cliente);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@Valid @RequestBody Cliente c) {
        try {
            Cliente salvo = clienteService.cadastrarCliente(c);
            return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @Valid @RequestBody Cliente clienteAtualizado) {
        try {
            Cliente atualizado = clienteService.atualizarCliente(id, clienteAtualizado);
            return ResponseEntity.ok(atualizado);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> excluir(@PathVariable Long id) {
        try {
            clienteService.excluirCliente(id);
            return ResponseEntity.ok("Cliente removido com sucesso!");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
