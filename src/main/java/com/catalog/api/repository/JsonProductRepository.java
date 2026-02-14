package com.catalog.api.repository;

import com.catalog.api.model.Product;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;

@Repository
public class JsonProductRepository implements ProductRepository {

    private final List<Product> products;

    public JsonProductRepository(ObjectMapper objectMapper, ResourceLoader resourceLoader) throws IOException {
        Resource resource = resourceLoader.getResource("classpath:catalog.json");
        try (InputStream inputStream = resource.getInputStream()) {
            this.products = List.copyOf(objectMapper.readValue(inputStream, new TypeReference<>() {
            }));
        }
    }

    @Override
    public List<Product> findAll() {
        return products;
    }

    @Override
    public Optional<Product> findById(String id) {
        return products.stream()
                .filter(product -> product.id().equals(id))
                .findFirst();
    }
}
