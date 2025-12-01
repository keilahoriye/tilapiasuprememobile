package com.example.pedidos.DTO;

import java.time.LocalDateTime;
import java.util.List;

public class PedidoDTO {
    public String nome;
    public String telefone;
    public String endereco;

    public LocalDateTime dataEntrega;
    public Double taxaEntrega;

    public List<ItemDTO> itens;

    public static class ItemDTO {
        public String produto;
        public int quantidade;
        public Double precoUnitario;
    }
}
