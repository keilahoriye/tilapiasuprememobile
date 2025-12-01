package com.example.pedidos.Controllers;

import com.example.pedidos.Models.PedidoItem;
import com.example.pedidos.Services.PedidoItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/itens")
public class PedidoItemController {

    private final PedidoItemService pedidoItemService;

    @Autowired
    public PedidoItemController(PedidoItemService pedidoItemService) {
        this.pedidoItemService = pedidoItemService;
    }

    @GetMapping
    public ResponseEntity<List<PedidoItem>>listar() {
        return ResponseEntity.ok(pedidoItemService.listarPedidoItens());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoItem> buscar(@PathVariable Long id) {
        PedidoItem pedidoItem = pedidoItemService.buscarPedidoItem(id);
        if (pedidoItem != null) {
            return ResponseEntity.ok(pedidoItem);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<PedidoItem> cadastrar(@Valid @RequestBody PedidoItem c) {
        PedidoItem salvo = pedidoItemService.cadastrarPedidoItem(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PedidoItem> atualizar(@PathVariable Long id, @Valid @RequestBody PedidoItem pedidoItemAtualizado) {
        try {
            PedidoItem atualizado = pedidoItemService.atualizarpedidoItem(id, pedidoItemAtualizado);
            return ResponseEntity.ok(atualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> excluir(@PathVariable Long id) {
        try {
            pedidoItemService.excluirPedidoItem(id);
            return ResponseEntity.ok("Itens do pedido removidos com sucesso!");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
