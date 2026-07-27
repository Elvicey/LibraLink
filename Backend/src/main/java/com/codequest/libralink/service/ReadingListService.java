package com.codequest.libralink.service;

import com.codequest.libralink.entity.Course;
import com.codequest.libralink.entity.Notification;
import com.codequest.libralink.entity.ReadingList;
import com.codequest.libralink.entity.User;
import com.codequest.libralink.repository.CourseRepository;
import com.codequest.libralink.repository.ReadingListRepository;
import com.codequest.libralink.repository.UserRepository;
import com.codequest.libralink.security.SchoolContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReadingListService {

    private final ReadingListRepository readingListRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;
    private final SchoolContext schoolContext;

    public ReadingListService(ReadingListRepository readingListRepository,
                              UserRepository userRepository,
                              CourseRepository courseRepository,
                              NotificationService notificationService,
                              SchoolContext schoolContext) {
        this.readingListRepository = readingListRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.notificationService = notificationService;
        this.schoolContext = schoolContext;
    }

    @Transactional
    public ReadingList saveReadingList(ReadingList list) {
        // Never trust a client-supplied id on create (H7) - see CategoryService.addCategory.
        list.setId(null);
        if (list.getCourseId() == null) {
            throw new IllegalArgumentException("courseId is required");
        }
        Course course = courseRepository.findById(list.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Course not found with id: " + list.getCourseId()));
        list.setSchoolId(course.getInstitution() != null ? course.getInstitution().getInstitutionId() : null);
        if (list.getCreatedAt() == null) {
            list.setCreatedAt(java.time.LocalDateTime.now());
        }
        if (list.getUpdatedAt() == null) {
            list.setUpdatedAt(java.time.LocalDateTime.now());
        }
        if (list.getIsPublished() == null) {
            list.setIsPublished(false);
        }
        return readingListRepository.save(list);
    }

    public List<ReadingList> getReadingListsByCourse(Integer courseId) {
        List<ReadingList> lists = readingListRepository.findByCourseId(courseId);
        if (schoolContext.isPlatformSuperAdmin()) {
            return lists;
        }
        Integer schoolId = schoolContext.requireSchoolId();
        return lists.stream().filter(l -> schoolId.equals(l.getSchoolId())).toList();
    }

    public ReadingList getById(Integer id) {
        return readingListRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reading list not found with id: " + id));
    }

    @Transactional
    public ReadingList publish(Integer id, boolean publish) {
        ReadingList list = getById(id);
        boolean wasPublished = Boolean.TRUE.equals(list.getIsPublished());
        list.setIsPublished(publish);
        if (publish) {
            list.setPublishedAt(java.time.LocalDateTime.now());
        }
        list.setUpdatedAt(java.time.LocalDateTime.now());
        ReadingList saved = readingListRepository.save(list);

        if (publish && !wasPublished) {
            notifyStudentsOfPublishedList(saved);
        }
        return saved;
    }

    private void notifyStudentsOfPublishedList(ReadingList list) {
        List<User> students = userRepository.findByRoles_NameIgnoreCase("STUDENT");

        for (User student : students) {
            Notification notification = new Notification();
            notification.setUserId(student.getId());
            notification.setSchoolId(list.getSchoolId());
            notification.setType("READING_LIST");
            notification.setTitle("New lecture-linked resources");
            notification.setMessage(
                    "\"" + (list.getTitle() != null ? list.getTitle() : "A course reading list")
                            + "\" is now available in LibraLink with lecture-aligned titles.");
            notification.setChannel("PUSH");
            notification.setReferenceId(list.getId());
            notification.setReferenceType("READING_LIST");
            notificationService.createNotification(notification);
        }
    }
}
