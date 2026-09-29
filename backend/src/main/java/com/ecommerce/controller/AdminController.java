package com.ecommerce.controller;

import com.ecommerce.dto.*;
import com.ecommerce.service.AdminService;
import com.ecommerce.service.CategoryService;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Toutes les routes d'administration.
 * Double protection : règle d'URL dans SecurityConfig + @PreAuthorize ici.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderService orderService;

    // ---------- Tableau de bord ----------

    @GetMapping("/stats")
    public DashboardStats stats() {
        return adminService.getStats();
    }

    // ---------- Produits ----------

    @GetMapping("/products")
    public List<ProductResponse> products(@RequestParam(required = false) Long categoryId,
                                          @RequestParam(required = false) String search) {
        return productService.search(categoryId, search);
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/products/{id}")
    public ProductResponse updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PatchMapping("/products/{id}/stock")
    public ProductResponse updateStock(@PathVariable Long id, @Valid @RequestBody StockUpdateRequest request) {
        return productService.updateStock(id, request.stock());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Catégories ----------

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/categories/{id}")
    public CategoryResponse updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Commandes ----------

    @GetMapping("/orders")
    public List<OrderResponse> orders() {
        return orderService.findAll();
    }

    @PatchMapping("/orders/{id}/status")
    public OrderResponse updateOrderStatus(@PathVariable Long id,
                                           @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.statut());
    }
}
