package com.ecommerce.controller;

import com.ecommerce.dto.ProductResponse;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Lecture publique du catalogue.
 * Exemples : /api/products, /api/products?categoryId=2, /api/products?search=casque
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> list(@RequestParam(required = false) Long categoryId,
                                      @RequestParam(required = false) String search) {
        return productService.search(categoryId, search);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.findById(id);
    }
}
