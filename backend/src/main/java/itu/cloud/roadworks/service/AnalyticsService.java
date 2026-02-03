package itu.cloud.roadworks.service;

import itu.cloud.roadworks.dto.WorkStatsDto;
import itu.cloud.roadworks.dto.WorkTimelineDto;
import itu.cloud.roadworks.model.Company;
import itu.cloud.roadworks.model.Signalement;
import itu.cloud.roadworks.model.SignalementWork;
import itu.cloud.roadworks.repository.CompanyRepository;
import itu.cloud.roadworks.repository.SignalementRepository;
import itu.cloud.roadworks.repository.SignalementWorkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final SignalementWorkRepository workRepository;
    private final SignalementRepository signalementRepository;
    private final CompanyRepository companyRepository;

    public WorkStatsDto computeWorkStats(Optional<Long> companyIdOpt, Optional<LocalDate> startDate, Optional<LocalDate> endDate, Optional<String> typeProblem) {
        List<SignalementWork> works = workRepository.findAll();

        if (companyIdOpt.isPresent()) {
            Long cid = companyIdOpt.get();
            works = works.stream()
                    .filter(w -> w.getCompany() != null && Objects.equals(w.getCompany().getId(), cid))
                    .collect(Collectors.toList());
        }

        if (typeProblem.isPresent()) {
            String typeKey = typeProblem.get().toLowerCase();
            works = works.stream()
                    .filter(w -> w.getSignalement() != null
                            && w.getSignalement().getTypeProblem() != null
                            && w.getSignalement().getTypeProblem().getLibelle() != null
                            && w.getSignalement().getTypeProblem().getLibelle().toLowerCase().equals(typeKey))
                    .collect(Collectors.toList());
        }

        if (startDate.isPresent() || endDate.isPresent()) {
            LocalDate start = startDate.orElse(LocalDate.MIN);
            LocalDate end = endDate.orElse(LocalDate.MAX);
            works = works.stream()
                    .filter(w -> {
                        LocalDate created = toLocalDate(w.getSignalement() != null && w.getSignalement().getCreatedAt() != null
                                ? Date.from(w.getSignalement().getCreatedAt())
                                : null);
                        LocalDate s = w.getStartDate();
                        LocalDate e = w.getRealEndDate() != null ? w.getRealEndDate() : w.getEndDateEstimation();
                        LocalDate pivot = created != null ? created : (s != null ? s : e);
                        if (pivot == null) return false;
                        return !pivot.isBefore(start) && !pivot.isAfter(end);
                    })
                    .collect(Collectors.toList());
        }

        Map<Long, Company> companies = companyRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Company::getId, c -> c));

        WorkStatsDto.Stat overall = computeStat(null, "Tous", works);

        // group by company
        Map<Company, List<SignalementWork>> grouped = works.stream()
                .filter(w -> w.getCompany() != null)
                .collect(Collectors.groupingBy(SignalementWork::getCompany));

        List<WorkStatsDto.Stat> byCompany = grouped.entrySet().stream()
                .map(entry -> computeStat(entry.getKey().getId(), entry.getKey().getName(), entry.getValue()))
                .sorted(Comparator.comparing(WorkStatsDto.Stat::getCompanyName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        return WorkStatsDto.builder()
                .overall(overall)
                .byCompany(byCompany)
                .build();
    }

    public List<WorkTimelineDto> listWorkTimelines(Optional<Long> companyIdOpt, Optional<LocalDate> startDate, Optional<LocalDate> endDate, Optional<String> typeProblem) {
        List<SignalementWork> works = workRepository.findAll();
        if (companyIdOpt.isPresent()) {
            Long cid = companyIdOpt.get();
            works = works.stream()
                    .filter(w -> w.getCompany() != null && Objects.equals(w.getCompany().getId(), cid))
                    .collect(Collectors.toList());
        }

        if (typeProblem.isPresent()) {
            String typeKey = typeProblem.get().toLowerCase();
            works = works.stream()
                    .filter(w -> w.getSignalement() != null
                            && w.getSignalement().getTypeProblem() != null
                            && w.getSignalement().getTypeProblem().getLibelle() != null
                            && w.getSignalement().getTypeProblem().getLibelle().toLowerCase().equals(typeKey))
                    .collect(Collectors.toList());
        }

        if (startDate.isPresent() || endDate.isPresent()) {
            LocalDate start = startDate.orElse(LocalDate.MIN);
            LocalDate end = endDate.orElse(LocalDate.MAX);
            works = works.stream()
                    .filter(w -> {
                        LocalDate created = toLocalDate(w.getSignalement() != null && w.getSignalement().getCreatedAt() != null
                                ? Date.from(w.getSignalement().getCreatedAt())
                                : null);
                        LocalDate s = w.getStartDate();
                        LocalDate e = w.getRealEndDate() != null ? w.getRealEndDate() : w.getEndDateEstimation();
                        LocalDate pivot = created != null ? created : (s != null ? s : e);
                        if (pivot == null) return false;
                        return !pivot.isBefore(start) && !pivot.isAfter(end);
                    })
                    .collect(Collectors.toList());
        }

        return works.stream()
                .map(w -> WorkTimelineDto.builder()
                        .id(w.getId())
                        .companyName(w.getCompany() != null ? w.getCompany().getName() : null)
                        .typeProblem(w.getSignalement() != null && w.getSignalement().getTypeProblem() != null
                                ? w.getSignalement().getTypeProblem().getLibelle()
                                : null)
                        .createdAt(w.getSignalement() != null ? w.getSignalement().getCreatedAt() : null)
                        .startDate(w.getStartDate())
                        .inProgressDate(w.getStartDate()) // simplification: début du travail = passage en cours
                        .endDate(w.getRealEndDate() != null ? w.getRealEndDate() : w.getEndDateEstimation())
                        .build())
                .sorted(Comparator.comparing(WorkTimelineDto::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private WorkStatsDto.Stat computeStat(Long companyId, String companyName, List<SignalementWork> works) {
        List<Double> lead = new ArrayList<>();
        List<Double> inProgress = new ArrayList<>();
        List<Double> total = new ArrayList<>();

        for (SignalementWork w : works) {
            Signalement s = w.getSignalement();
            LocalDate created = s != null && s.getCreatedAt() != null
                    ? LocalDate.ofInstant(s.getCreatedAt(), ZoneId.systemDefault())
                    : null;
            LocalDate start = w.getStartDate();
            LocalDate end = w.getRealEndDate() != null ? w.getRealEndDate() : w.getEndDateEstimation();

            if (created != null && start != null) {
                lead.add(daysBetween(start, created));
            }
            if (start != null && end != null) {
                inProgress.add(daysBetween(end, start));
            }
            if (created != null && end != null) {
                total.add(daysBetween(end, created));
            }
        }

        return WorkStatsDto.Stat.builder()
                .companyId(companyId)
                .companyName(companyName)
                .avgLeadDays(avg(lead))
                .avgInProgressDays(avg(inProgress))
                .avgTotalDays(avg(total))
                .count((long) works.size())
                .build();
    }

    private double daysBetween(LocalDate end, LocalDate start) {
        return Duration.between(start.atStartOfDay(), end.atStartOfDay()).toDays();
    }

    private Double avg(List<Double> values) {
        if (values == null || values.isEmpty()) return null;
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(Double.NaN);
    }

    private LocalDate toLocalDate(Date date) {
        if (date == null) return null;
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }
}
