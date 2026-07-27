package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.ReadingListItem;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.ReadingListItemRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReadingListItemService {

    private final ReadingListItemRepository readingListItemRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SchoolContext schoolContext;

    public ReadingListItemService(ReadingListItemRepository readingListItemRepository,
                                  BookRepository bookRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService,
                                  SchoolContext schoolContext) {
        this.readingListItemRepository = readingListItemRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.schoolContext = schoolContext;
    }

    public ReadingListItem addItemToList(ReadingListItem item) {
        if (item.getReadingListId() == null) {
            throw new IllegalArgumentException("readingListId is required");
        }
        if (item.getBookId() == null) {
            throw new IllegalArgumentException("bookId is required");
        }
        Book book = bookRepository.findById(item.getBookId())
                .orElseThrow(() -> new IllegalArgumentException("Book not found with id: " + item.getBookId()));
        item.setSchoolId(book.getInstitution() != null ? book.getInstitution().getInstitutionId() : null);
        if (item.getCreatedAt() == null) {
            item.setCreatedAt(java.time.LocalDateTime.now());
        }
        if (item.getUpdatedAt() == null) {
            item.setUpdatedAt(java.time.LocalDateTime.now());
        }
        ReadingListItem saved = readingListItemRepository.save(item);
        alertLibrariansIfLowStock(saved.getBookId());
        return saved;
    }

    public List<ReadingListItem> addBooksBulk(Integer readingListId, List<Integer> bookIds, String priority) {
        String note = priority != null && !priority.isBlank() ? priority.trim().toUpperCase() : "REQUIRED";
        return bookIds.stream().map(bookId -> {
            ReadingListItem item = new ReadingListItem();
            item.setReadingListId(readingListId);
            item.setBookId(bookId);
            item.setNotes(note);
            return addItemToList(item);
        }).toList();
    }

    public List<ReadingListItem> getItemsByReadingList(Integer readingListId) {
        List<ReadingListItem> items = readingListItemRepository.findByReadingListId(readingListId);
        if (schoolContext.isPlatformSuperAdmin()) {
            return items;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return items.stream().filter(i -> schoolId.equals(i.getSchoolId())).toList();
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

    private void alertLibrariansIfLowStock(Integer bookId) {
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null) {
            return;
        }
        int available = book.getAvailableCopies() != null ? book.getAvailableCopies() : 0;
        if (available > 1) {
            return;
        }

        List<User> staff = userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().stream().anyMatch(role -> {
                    String name = role.getName();
                    return "LIBRARIAN".equalsIgnoreCase(name) || "ADMIN".equalsIgnoreCase(name);
                }))
                .toList();

        Integer schoolId = book.getInstitution() != null ? book.getInstitution().getInstitutionId() : null;
        for (User user : staff) {
            Notification notification = new Notification();
            notification.setUserId(user.getId());
            notification.setSchoolId(schoolId);
            notification.setType("LOW_STOCK");
            notification.setTitle("Lecture demand: low stock");
            notification.setMessage(
                    "A lecture reading list referenced \"" + book.getTitle()
                            + "\" which has only " + available
                            + " copy/copies available. Replenish stock before student demand peaks.");
            notification.setChannel("PUSH");
            notification.setReferenceId(book.getId());
            notification.setReferenceType("BOOK");
            notificationService.createNotification(notification);
        }
    }
}
