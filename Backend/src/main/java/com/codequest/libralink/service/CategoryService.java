package com.codequest.libralink.service;

import com.codequest.libralink.entity.Category;
import com.codequest.libralink.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;


@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public Category addCategory(Category category) {
        // Never trust a client-supplied id on create - JPA save() on an entity with an
        // existing id performs an UPDATE/merge, so a forged id could silently overwrite
        // an unrelated existing row instead of creating a new one (H7).
        category.setId(null);

        // Categories are a single shared, platform-wide taxonomy (no schoolId), and the
        // Web book form lets any school's staff add one inline. Without this check, two
        // schools (or the same school twice) typing "Fiction" each mint a separate row -
        // find-or-create on a case-insensitive, trimmed name keeps it one shared category
        // instead of silently accumulating duplicates.
        if (category.getName() != null) {
            String trimmed = category.getName().trim();
            category.setName(trimmed);
            Optional<Category> existing = categoryRepository.findByNameIgnoreCase(trimmed);
            if (existing.isPresent()) {
                return existing.get();
            }
        }
        return categoryRepository.save(category);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}