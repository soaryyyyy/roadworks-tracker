package itu.cloud.roadworks.service;

import itu.cloud.roadworks.dto.SignalementDto;
import itu.cloud.roadworks.model.Signalement;
import itu.cloud.roadworks.repository.SignalementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignalementService {
    private final SignalementRepository repository;

    public List<SignalementDto> findAll() {
        return repository.findAll()
                .stream()
                .map(SignalementDto::fromEntity)
                .collect(Collectors.toList());
    }
}
