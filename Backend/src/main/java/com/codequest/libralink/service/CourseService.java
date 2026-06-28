package com.codequest.libralink.service;

import com.codequest.libralink.entity.Course;
import com.codequest.libralink.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
// Lombok removed: @RequiredArgsConstructor is gone
public class CourseService {

    private final CourseRepository courseRepository;

    // Explicit constructor added to handle dependency injection manually
    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public Course saveCourse(Course course) {
        return courseRepository.save(course);
    }

    public List<Course> getCoursesByInstitution(Integer instId) {
        return courseRepository.findByInstitutionId(instId);
    }
}