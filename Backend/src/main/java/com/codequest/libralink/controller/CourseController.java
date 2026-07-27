package com.codequest.libralink.controller;

import com.codequest.libralink.entity.Course;
import com.codequest.libralink.service.CourseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.codequest.libralink.security.Roles;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PreAuthorize(Roles.STAFF)
    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        return new ResponseEntity<>(courseService.saveCourse(course), HttpStatus.CREATED);
    }

    @GetMapping("/institutions/{instId}")
    public ResponseEntity<List<Course>> getCourses(@PathVariable Integer instId) {
        return ResponseEntity.ok(courseService.getCoursesByInstitution(instId));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<Course> getCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(courseService.getCourseById(courseId));
    }

    @PreAuthorize(Roles.STAFF)
    @PutMapping("/{courseId}/books")
    public ResponseEntity<?> addBooksToCourse(@PathVariable Integer courseId,
                                               @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> bookIds = (List<Integer>) body.get("bookIds");
            Course updated = courseService.addBooksToCourse(courseId, bookIds);
            return ResponseEntity.ok(updated);
        } catch (com.codequest.libralink.exception.ResourceNotFoundException e) {
            // Let GlobalExceptionHandler turn this into a proper 404 instead of 400.
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize(Roles.STAFF)
    @DeleteMapping("/{courseId}/books/{bookId}")
    public ResponseEntity<?> removeBookFromCourse(@PathVariable Integer courseId,
                                                   @PathVariable Integer bookId) {
        try {
            Course updated = courseService.removeBookFromCourse(courseId, bookId);
            return ResponseEntity.ok(updated);
        } catch (com.codequest.libralink.exception.ResourceNotFoundException e) {
            // Let GlobalExceptionHandler turn this into a proper 404 instead of 400.
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
