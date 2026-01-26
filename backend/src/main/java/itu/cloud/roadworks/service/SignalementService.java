package itu.cloud.roadworks.service;

import itu.cloud.roadworks.dto.SignalementProblemDto;
import itu.cloud.roadworks.model.Signalement;
import itu.cloud.roadworks.model.SignalementStatus;
import itu.cloud.roadworks.model.SignalementWork;
import itu.cloud.roadworks.repository.SignalementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignalementService {
    private final SignalementRepository repository;

    public List<SignalementProblemDto> findAllProblems() {
        return repository.findAll()
                .stream()
                .map(this::toProblemDto)
                .collect(Collectors.toList());
    }

    private SignalementProblemDto toProblemDto(Signalement signalement) {
        SignalementStatus latestStatus = signalement.getStatuses().stream().findFirst().orElse(null);
        SignalementWork latestWork = signalement.getWorks().stream().findFirst().orElse(null);

        SignalementProblemDto.SignalementProblemDetail detail = SignalementProblemDto.SignalementProblemDetail.builder()
                .etat(Optional.ofNullable(latestStatus).map(s -> s.getStatusSignalement().getLibelle()).orElse(null))
                .dateProblem(signalement.getCreatedAt())
                .surfaceM2(signalement.getSurface())
                .budget(latestWork != null ? latestWork.getPrice() : null)
                .entrepriseAssign(Optional.ofNullable(latestWork)
                        .map(work -> SignalementProblemDto.CompanyDto.builder()
                                .id(work.getCompany().getId())
                                .name(work.getCompany().getName())
                                .build())
                        .orElse(null))
                .description(signalement.getDescriptions())
                .build();

        return SignalementProblemDto.builder()
                .id(signalement.getId())
                .typeProblem(signalement.getTypeProblem().getLibelle())
                .illustrationProblem(signalement.getTypeProblem().getIcone())
                .location(signalement.getLocation())
                .detail(detail)
                .build();
    }
}
