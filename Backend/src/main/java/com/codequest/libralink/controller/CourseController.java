package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Course;
import com.codequest.libralink.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    // Explicit constructor instead of Lombok's @RequiredArgsConstructor
    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        return ResponseEntity.ok(courseService.saveCourse(course));
    }

    @GetMapping("/institutions/{instId}")
    public ResponseEntity<List<Course>> getCourses(@PathVariable Integer instId) {
        return ResponseEntity.ok(courseService.getCoursesByInstitution(instId));
    }
}