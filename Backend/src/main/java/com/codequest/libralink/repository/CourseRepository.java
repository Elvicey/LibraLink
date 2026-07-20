package com.codequest.libralink.repository;

import com.codequest.libralink.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Integer> {
    List<Course> findByInstitutionInstitutionId(Integer institutionId);
}