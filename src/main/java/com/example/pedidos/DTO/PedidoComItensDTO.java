package com.example.pedidos.DTO;

import java.time.LocalDateTime;
import java.util.List;

public class PedidoComItensDTO {
    public Long id;
    public String nomeCliente;
    public String telefone;
    public LocalDateTime dataEntrega;
    public Double taxaEntrega;
    public List<ItemDTO> itens;

    public static class ItemDTO {
        public String produto;
        public int quantidade;

        public ItemDTO(String produto, int quantidade) {
            this.produto = produto;
            this.quantidade = quantidade;
        }
    }

    public PedidoComItensDTO(Long id, String nomeCliente, String telefone, LocalDateTime dataEntrega,
                             Double taxaEntrega, List<ItemDTO> itens) {
        this.id = id;
        this.nomeCliente = nomeCliente;
        this.telefone = telefone;
        this.dataEntrega = dataEntrega;
        this.taxaEntrega = taxaEntrega;
        this.itens = itens;
    }
}
