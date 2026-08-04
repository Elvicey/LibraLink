package com.codequest.libralink.service;

import com.codequest.libralink.entity.Publisher;
import com.codequest.libralink.repository.PublisherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PublisherService {

    @Autowired
    private PublisherRepository publisherRepository;

    public Publisher addPublisher(Publisher publisher) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        publisher.setId(null);
        return publisherRepository.save(publisher);
    }

    public List<Publisher> getAllPublishers() {
        return publisherRepository.findAll();
    }
}