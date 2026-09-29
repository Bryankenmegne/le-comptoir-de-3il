package com.ecommerce.service;

import com.ecommerce.dto.CategoryRequest;
import com.ecommerce.dto.CategoryResponse;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ConflictException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Category;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Gestion des catégories.
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll(Sort.by("nom")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String nom = request.nom().trim();
        if (categoryRepository.existsByNomIgnoreCase(nom)) {
            throw new ConflictException("Une catégorie porte déjà ce nom");
        }
        Category category = Category.builder()
                .nom(nom)
                .description(clean(request.description()))
                .build();
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getEntity(id);
        String nom = request.nom().trim();
        if (categoryRepository.existsByNomIgnoreCaseAndIdNot(nom, id)) {
            throw new ConflictException("Une autre catégorie porte déjà ce nom");
        }
        category.setNom(nom);
        category.setDescription(clean(request.description()));
        return toResponse(category);
    }

    /** Refuse la suppression si des produits sont encore rattachés à la catégorie. */
    @Transactional
    public void delete(Long id) {
        Category category = getEntity(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new BadRequestException(
                    "Impossible de supprimer « " + category.getNom()
                            + " » : déplacez ou supprimez d'abord ses produits");
        }
        categoryRepository.delete(category);
    }

    /** Utilisé aussi par ProductService (toujours appelé dans une transaction existante). */
    public Category getEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie", id));
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getNom(), c.getDescription(),
                productRepository.countByCategoryId(c.getId()));
    }

    private String clean(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
