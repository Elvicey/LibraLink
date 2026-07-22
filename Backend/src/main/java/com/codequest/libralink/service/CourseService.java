package com.codequest.libralink.service;

import com.codequest.libralink.entity.Book;
import com.codequest.libralink.entity.Course;
import com.codequest.libralink.entity.Institution;
import com.codequest.libralink.repository.BookRepository;
import com.codequest.libralink.repository.CourseRepository;
import com.codequest.libralink.repository.InstitutionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final InstitutionRepository institutionRepository;
    private final BookRepository bookRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public CourseService(CourseRepository courseRepository, InstitutionRepository institutionRepository,
                         BookRepository bookRepository) {
        this.courseRepository = courseRepository;
        this.institutionRepository = institutionRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public Course saveCourse(Course course) {
        if (course.getName() == null || course.getName().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        if (course.getInstitution() == null || course.getInstitution().getInstitutionId() == null) {
            throw new IllegalArgumentException("institution.institutionId is required");
        }

        Integer institutionId = course.getInstitution().getInstitutionId();
        Institution managed = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Institution not found with id: " + institutionId));
        course.setInstitution(managed);

        if (course.getStatus() == null || course.getStatus().isBlank()) {
            course.setStatus("ACTIVE");
        }
        if (course.getCreatedAt() == null) {
            course.setCreatedAt(java.time.LocalDateTime.now());
        }

        return courseRepository.save(course);
    }

    public List<Course> getCoursesByInstitution(Integer instId) {
        return courseRepository.findByInstitutionInstitutionId(instId);
    }

    @Transactional(readOnly = true)
    public Course getCourseById(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + courseId));
        course.getBooks().size();
        return course;
    }

    @Transactional
    public Course addBooksToCourse(Integer courseId, List<Integer> bookIds) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Set<Book> books = new HashSet<>(course.getBooks());
        List<Book> newBooks = bookRepository.findAllById(bookIds);
        books.addAll(newBooks);
        course.setBooks(books);

        return courseRepository.save(course);
    }

    @Transactional
    public Course removeBookFromCourse(Integer courseId, Integer bookId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        course.getBooks().removeIf(book -> book.getId().equals(bookId));

        return courseRepository.save(course);
    }
}
