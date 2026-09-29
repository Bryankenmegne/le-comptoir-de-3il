package com.ecommerce.controller;

import com.ecommerce.dto.CategoryResponse;
import com.ecommerce.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lecture publique des catégories.
 * Le CRUD se trouve dans AdminController (/api/admin/categories).
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> list() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    public CategoryResponse get(@PathVariable Long id) {
        return categoryService.findById(id);
    }
}
