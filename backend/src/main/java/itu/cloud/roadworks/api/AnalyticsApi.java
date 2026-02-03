package itu.cloud.roadworks.api;

import itu.cloud.roadworks.dto.WorkStatsDto;
import itu.cloud.roadworks.dto.WorkTimelineDto;
import itu.cloud.roadworks.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsApi {

    private final AnalyticsService analyticsService;

    @GetMapping("/work-stats")
    public ResponseEntity<WorkStatsDto> workStats(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @RequestParam(name = "startDate", required = false) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) LocalDate endDate,
            @RequestParam(name = "typeProblem", required = false) String typeProblem
    ) {
        return ResponseEntity.ok(analyticsService.computeWorkStats(
                Optional.ofNullable(companyId),
                Optional.ofNullable(startDate),
                Optional.ofNullable(endDate),
                Optional.ofNullable(typeProblem)
        ));
    }

    @GetMapping("/work-timelines")
    public ResponseEntity<Iterable<WorkTimelineDto>> workTimelines(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @RequestParam(name = "startDate", required = false) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) LocalDate endDate,
            @RequestParam(name = "typeProblem", required = false) String typeProblem
    ) {
        return ResponseEntity.ok(analyticsService.listWorkTimelines(
                Optional.ofNullable(companyId),
                Optional.ofNullable(startDate),
                Optional.ofNullable(endDate),
                Optional.ofNullable(typeProblem)
        ));
    }
}
