package com.example.pedidos.Controllers;

import com.example.pedidos.DTO.ProdutoDTO;
import com.example.pedidos.Models.Produto;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @GetMapping
    public List<ProdutoDTO> listarProdutos() {
        return List.of(Produto.values()).stream()
                .map(p -> new ProdutoDTO(
                        p.name(),
                        p.getDescricao(),
                        p.getPreco()
                ))
                .collect(Collectors.toList());
    }
}
