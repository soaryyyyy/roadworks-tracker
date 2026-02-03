package itu.cloud.roadworks.api;

import itu.cloud.roadworks.model.AdvancementRate;
import itu.cloud.roadworks.repository.AdvancementRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advancement-rates")
@RequiredArgsConstructor
public class AdvancementRateApi {

    private final AdvancementRateRepository repository;

    @GetMapping
    public ResponseEntity<List<AdvancementRate>> findAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PutMapping("/{statusKey}")
    public ResponseEntity<AdvancementRate> upsert(
            @PathVariable String statusKey,
            @RequestParam Integer percentage
    ) {
        AdvancementRate rate = repository.findByStatusKeyIgnoreCase(statusKey)
                .orElse(AdvancementRate.builder().statusKey(statusKey).build());
        rate.setPercentage(percentage);
        return ResponseEntity.ok(repository.save(rate));
    }
}
