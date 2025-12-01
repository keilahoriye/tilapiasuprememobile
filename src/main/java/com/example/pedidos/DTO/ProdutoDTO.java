package com.example.pedidos.DTO;

public class ProdutoDTO {
    public String codigo;
    public String descricao;
    public double preco;

    public ProdutoDTO(String codigo, String descricao, double preco) {
        this.codigo = codigo;
        this.descricao = descricao;
        this.preco = preco;
    }
}
