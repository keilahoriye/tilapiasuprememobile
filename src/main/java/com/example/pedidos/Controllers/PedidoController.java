package com.example.pedidos.Controllers;

import com.example.pedidos.DTO.PedidoDTO;
import com.example.pedidos.DTO.PedidoResumoDTO;
import com.example.pedidos.Models.Cliente;
import com.example.pedidos.Models.Pedido;
import com.example.pedidos.Models.PedidoItem;
import com.example.pedidos.Models.Produto;
import com.example.pedidos.Repositories.ClienteRepository;
import com.example.pedidos.Services.PedidoService;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    @Autowired
    private ClienteRepository clienteRepository;

    private final PedidoService pedidoService;

    @Autowired
    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @GetMapping
    public ResponseEntity<List<PedidoResumoDTO>> listar() {
        return ResponseEntity.ok(pedidoService.listarPedidosResumo());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscar(@PathVariable Long id) {
        Pedido pedido = pedidoService.buscarPedido(id);
        if (pedido != null) {
            return ResponseEntity.ok(pedido);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/itens")
    public ResponseEntity<List<PedidoItem>> listarItensDoPedido(@PathVariable Long id) {
        Pedido pedido = pedidoService.buscarPedido(id);

        if (pedido == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(pedido.getItens());
    }

    @GetMapping("/buscar")
    public ResponseEntity<?> buscarPedidosMobile(
            @RequestParam(required = false) String cliente,
            @RequestParam(required = false) String telefone,
            @RequestParam(required = false) String produto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        return ResponseEntity.ok(
                pedidoService.buscarPedidosComFiltrosDTO(cliente, telefone, produto, inicio, fim)
        );
    }

    @PostMapping
    public ResponseEntity<Pedido> cadastrar(@Valid @RequestBody Pedido c) {
        Pedido salvo = pedidoService.cadastrarPedido(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @Valid @RequestBody Pedido pedidoAtualizado) {
        try {
            Pedido atualizado = pedidoService.atualizarPedido(id, pedidoAtualizado);
            return ResponseEntity.ok(atualizado);
        } catch (Exception e) {
            e.printStackTrace(); // <-- MOSTRA O ERRO NO LOG
            return ResponseEntity.status(500).body("Erro: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> excluir(@PathVariable Long id) {
        try {
            pedidoService.excluirPedido(id);
            return ResponseEntity.ok("Pedido removido com sucesso!");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ---------------- NOVO ENDPOINT PARA O MOBILE --------------------

    @PostMapping("/mobile")
    public ResponseEntity<Pedido> cadastrarMobile(@RequestBody PedidoDTO dto) {

        // 1. Buscar cliente pelo telefone
        Cliente cliente = clienteRepository.findByTelefone(dto.telefone);

        // 2. Criar novo cliente se não existir
        if (cliente == null) {
            cliente = new Cliente();
            cliente.setNome(dto.nome);
            cliente.setTelefone(dto.telefone);
            cliente.setEndereco(dto.endereco);
            clienteRepository.save(cliente);
        }

        // 3. Criar o Pedido
        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);
        pedido.setDataEntrega(dto.dataEntrega);
        pedido.setTaxaEntrega(dto.taxaEntrega);

        // 4. Criar Itens
        for (PedidoDTO.ItemDTO item : dto.itens) {
            PedidoItem pi = new PedidoItem();
            pi.setProduto(Produto.valueOf(item.produto));
            pi.setQuantidade(item.quantidade);
            pi.setPedido(pedido);
            pedido.getItens().add(pi);
        }

        // 5. Salvar
        Pedido salvo = pedidoService.cadastrarPedido(pedido);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }
}
