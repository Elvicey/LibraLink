package com.codequest.libralink.service;

import com.codequest.libralink.entity.ReadingListItem;
import com.codequest.libralink.repository.ReadingListItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReadingListItemService {

    private final ReadingListItemRepository readingListItemRepository;

    // Lombok removed: explicit constructor added
    public ReadingListItemService(ReadingListItemRepository readingListItemRepository) {
        this.readingListItemRepository = readingListItemRepository;
    }

    public ReadingListItem addItemToList(ReadingListItem item) {
        return readingListItemRepository.save(item);
    }

    public List<ReadingListItem> getItemsByReadingList(Integer readingListId) {
        return readingListItemRepository.findByReadingListId(readingListId);
    }

    public ReadingListItem getItemById(Integer itemId) {
        return readingListItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Reading list item not found with id: " + itemId));
    }

    public ReadingListItem updateItem(Integer itemId, ReadingListItem updatedItem) {
        ReadingListItem existing = getItemById(itemId);
        existing.setBookId(updatedItem.getBookId());
        existing.setNotes(updatedItem.getNotes());
        existing.setRequiredBy(updatedItem.getRequiredBy());
        return readingListItemRepository.save(existing);
    }

    public void removeItemFromList(Integer itemId) {
        ReadingListItem item = getItemById(itemId);
        readingListItemRepository.delete(item);
    }
}