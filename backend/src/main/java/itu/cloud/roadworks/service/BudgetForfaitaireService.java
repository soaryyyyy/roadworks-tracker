package itu.cloud.roadworks.service;

import itu.cloud.roadworks.repository.DefaultPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class BudgetForfaitaireService {

    private final DefaultPriceRepository defaultPriceRepository;

    public BigDecimal calculerBudget(BigDecimal surfaceM2) {
        if (surfaceM2 == null) {
            throw new IllegalArgumentException("Surface obligatoire pour calculer le budget");
        }
        if (surfaceM2.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Surface invalide (>0)");
        }

        BigDecimal prixM2 = defaultPriceRepository.findTopByOrderByIdDesc()
                .map(defaultPrice -> defaultPrice.getPrice())
                .orElseThrow(() -> new IllegalStateException("Prix forfaitaire m² non défini"));

        if (prixM2 == null || prixM2.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Prix forfaitaire m² invalide");
        }

        return prixM2.multiply(surfaceM2).setScale(2, RoundingMode.HALF_UP);
    }
}

