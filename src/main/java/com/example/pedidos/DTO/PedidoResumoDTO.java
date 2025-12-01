package com.example.pedidos.DTO;

import java.time.LocalDateTime;
import java.util.List;

public class PedidoResumoDTO {
    public Long id;
    public String nomeCliente;
    public String telefone;
    public String endereco;
    public LocalDateTime dataEntrega;
    public Double taxaEntrega;

    // 💡 CRÍTICO: Novo campo para a lista de itens
    public List<ItemDTO> itens;

    // 💡 CRÍTICO: DTO aninhado para os itens (incluindo a descrição para o Front-end)
    public static class ItemDTO {
        public String produto;          // O código do Enum (ex: "FILE")
        public int quantidade;
        public Double precoUnitario;
        public String descricao;    // A descrição amigável (ex: "Filé de Tilápia - 1kg")

        // Construtor para ItemDTO (opcional, mas recomendado para mapeamento)
        public ItemDTO(String produto, int quantidade, Double precoUnitario, String descricao) {
            this.produto = produto;
            this.quantidade = quantidade;
            this.precoUnitario = precoUnitario;
            this.descricao = descricao;
        }
    }

    // O construtor principal do PedidoResumoDTO precisará ser atualizado para incluir a lista de itens.
    // Você provavelmente usará ele para a tela de listagem, sem a lista de itens preenchida.
    // Para a edição, você fará a chamada de serviço mapeando os itens.

    // Construtor para listagem (sem itens)
    public PedidoResumoDTO(Long id, String nomeCliente, String telefone, String endereco, LocalDateTime dataEntrega, Double taxaEntrega) {
        this.id = id;
        this.nomeCliente = nomeCliente;
        this.telefone = telefone;
        this.endereco = endereco;
        this.dataEntrega = dataEntrega;
        this.taxaEntrega = taxaEntrega;
    }

    // Construtor completo para a tela de edição
    public PedidoResumoDTO(Long id, String nomeCliente, String telefone, String endereco, LocalDateTime dataEntrega, Double taxaEntrega, List<ItemDTO> itens) {
        this(id, nomeCliente, telefone, endereco, dataEntrega, taxaEntrega);
        this.itens = itens;
    }
}