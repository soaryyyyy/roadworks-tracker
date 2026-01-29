package itu.cloud.roadworks.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowCredentials(true);
                registry.addMapping("/swagger-ui/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET");
                registry.addMapping("/api-docs/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET");
                registry.addMapping("/v3/api-docs/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET");
            }
        };
    }
}
