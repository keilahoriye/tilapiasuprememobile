package com.example.pedidos.Services;

import com.example.pedidos.Models.PedidoItem;
import com.example.pedidos.Repositories.PedidoItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PedidoItemService {

    private final PedidoItemRepository pedidoItemRepository;

    public PedidoItemService(PedidoItemRepository pedidoItemRepository) {
        this.pedidoItemRepository = pedidoItemRepository;
    }

    public PedidoItem cadastrarPedidoItem(PedidoItem pedidoItem) {
        return pedidoItemRepository.save(pedidoItem);
    }

    public List<PedidoItem> listarPedidoItens() {
        return pedidoItemRepository.findAll();
    }

    public PedidoItem buscarPedidoItem(Long id) {
        return pedidoItemRepository.findById(id).orElse(null);
    }

    public PedidoItem atualizarpedidoItem(Long id, PedidoItem contactAtualizado) {
        PedidoItem pedidoItem = pedidoItemRepository.findById(id).orElse(null);
        if (pedidoItem != null) {
            pedidoItem.setProduto(contactAtualizado.getProduto());
            pedidoItem.setQuantidade(contactAtualizado.getQuantidade());
            pedidoItem.setPedido(contactAtualizado.getPedido());
            return pedidoItemRepository.save(pedidoItem);
        } else {
            throw new RuntimeException("Itens do pedido não encontrados com id: " + id);
        }
    }

    public void excluirPedidoItem(Long id) {
        pedidoItemRepository.deleteById(id);
    }
}
