package itu.cloud.roadworks.api;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import itu.cloud.roadworks.dto.SignalementDto;
import itu.cloud.roadworks.service.SignalementService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
public class SignalementApi {

    private final SignalementService service;

    @GetMapping
    public List<SignalementDto> findAll() {
        return service.findAll();
    }
}
