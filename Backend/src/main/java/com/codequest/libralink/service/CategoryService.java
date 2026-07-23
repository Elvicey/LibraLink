package com.codequest.libralink.service;

import com.codequest.libralink.entity.Category;
import com.codequest.libralink.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;


@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public Category addCategory(Category category) {
        // Never trust a client-supplied id on create - JPA save() on an entity with an
        // existing id performs an UPDATE/merge, so a forged id could silently overwrite
        // an unrelated existing row instead of creating a new one (H7).
        category.setId(null);
        return categoryRepository.save(category);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}