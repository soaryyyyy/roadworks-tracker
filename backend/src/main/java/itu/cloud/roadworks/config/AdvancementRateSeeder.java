package itu.cloud.roadworks.config;

import itu.cloud.roadworks.model.AdvancementRate;
import itu.cloud.roadworks.repository.AdvancementRateRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AdvancementRateSeeder {

    private final AdvancementRateRepository repository;

    @PostConstruct
    public void seedDefaults() {
        Map<String, Integer> defaults = Map.of(
                "nouveau", 0,
                "new", 0,
                "en_cours", 50,
                "in_progress", 50,
                "terminé", 100,
                "completed", 100
        );

        defaults.forEach((key, value) -> repository.findByStatusKeyIgnoreCase(key)
                .orElseGet(() -> repository.save(AdvancementRate.builder()
                        .statusKey(key)
                        .percentage(value)
                        .build()))
        );
    }
}
