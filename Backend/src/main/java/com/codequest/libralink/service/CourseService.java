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
        if (course.getInstitution() != null && course.getInstitution().getInstitutionId() != null) {
            Institution managed = entityManager.getReference(Institution.class,
                    course.getInstitution().getInstitutionId());
            course.setInstitution(managed);
        }
        return courseRepository.save(course);
    }

    public List<Course> getCoursesByInstitution(Integer instId) {
        return courseRepository.findByInstitutionInstitutionId(instId);
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
