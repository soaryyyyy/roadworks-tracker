package itu.cloud.roadworks.service;

import itu.cloud.roadworks.dto.SignalementProblemDto;
import itu.cloud.roadworks.model.Signalement;
import itu.cloud.roadworks.model.SignalementStatus;
import itu.cloud.roadworks.model.SignalementWork;
import itu.cloud.roadworks.model.TypeProblem;
import itu.cloud.roadworks.model.Account;
import itu.cloud.roadworks.model.Company;
import itu.cloud.roadworks.repository.SignalementRepository;
import itu.cloud.roadworks.repository.SignalementStatusRepository;
import itu.cloud.roadworks.repository.StatusSignalementRepository;
import itu.cloud.roadworks.repository.TypeProblemRepository;
import itu.cloud.roadworks.repository.AccountRepository;
import itu.cloud.roadworks.repository.SignalementWorkRepository;
import itu.cloud.roadworks.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.api.core.ApiFuture;

import java.time.Instant;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignalementService {
    private final SignalementRepository repository;
    private final SignalementStatusRepository statusRepository;
    private final StatusSignalementRepository statusSignalementRepository;
    private final TypeProblemRepository typeProblemRepository;
    private final AccountRepository accountRepository;
    private final SignalementWorkRepository workRepository;
    private final CompanyRepository companyRepository;
    private final FirebaseService firebaseService;

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

    public void updateStatus(Long signalementId, String statusName) throws Exception {
        Signalement signalement = repository.findById(signalementId)
                .orElseThrow(() -> new Exception("Signalement non trouvé"));

        var statusSignalement = statusSignalementRepository.findByLibelle(statusName)
                .orElseThrow(() -> new Exception("Statut invalide: " + statusName));

        SignalementStatus newStatus = SignalementStatus.builder()
                .signalement(signalement)
                .statusSignalement(statusSignalement)
                .updatedAt(Instant.now())
                .build();

        statusRepository.save(newStatus);
    }

    public int syncFromFirebase() throws Exception {
        System.out.println("=== DEBUT SYNCFROMFIREBASE ===");
        
        Firestore db = firebaseService.getFirestore();
        System.out.println("Firestore instance: " + (db != null ? "OK" : "NULL"));
        
        if (db == null) {
            System.out.println("Firebase n'est pas initialisé - retour 0 synchronisé");
            return 0;
        }

        try {
            System.out.println("Récupération des documents de la collection 'roadworks_reports'");
            ApiFuture<QuerySnapshot> query = db.collection("roadworks_reports").get();
            
            // Ajouter un timeout de 30 secondes
            System.out.println("Attendre la réponse de Firestore...");
            QuerySnapshot querySnapshot = query.get(30, java.util.concurrent.TimeUnit.SECONDS);
            System.out.println("Nombre de documents trouvés: " + querySnapshot.getDocuments().size());

            int count = 0;
            Account defaultAccount = accountRepository.findByUsername("admin").orElse(null);
            TypeProblem defaultType = typeProblemRepository.findAll().stream().findFirst().orElse(null);

            if (defaultAccount == null || defaultType == null) {
                System.out.println("Compte admin ou type de problème non trouvé");
                return 0;
            }

            for (var document : querySnapshot.getDocuments()) {
                try {
                    String firebaseId = document.getId();
                    System.out.println("\n--- Traitement du document: " + firebaseId + " ---");
                    
                    // Vérifier si ce signalement a déjà été synchronisé
                    if (repository.findByFirebaseId(firebaseId).isPresent()) {
                        System.out.println("✓ Signalement Firebase déjà synchronisé: " + firebaseId);
                        continue;
                    }

                    String description = document.getString("description");
                    Double lat = document.getDouble("lat");
                    Double lng = document.getDouble("lng");
                    String status = document.getString("status");
                    
                    System.out.println("Valeurs trouvées:");
                    System.out.println("  description: " + description);
                    System.out.println("  lat: " + lat);
                    System.out.println("  lng: " + lng);
                    System.out.println("  status: " + status);
                    System.out.println("Tous les champs du document: " + document.getData());

                    if (description != null && lat != null && lng != null) {
                        System.out.println("✓ Champs requis présents, création du signalement...");
                        
                        Signalement signalement = Signalement.builder()
                                .account(defaultAccount)
                                .typeProblem(defaultType)
                                .descriptions(description)
                                .location(lat + "," + lng)
                                .createdAt(Instant.now())
                                .firebaseId(firebaseId)
                                .build();

                        Signalement saved = repository.save(signalement);
                        System.out.println("✓ Signalement sauvegardé avec ID: " + saved.getId());

                        // Mapper le statut Firestore vers les statuts de la base
                        String statusToUse = "nouveau"; // défaut
                        if (status != null && !status.isEmpty()) {
                            String firebaseStatus = status.toLowerCase().trim();
                            System.out.println("  Mapping du statut: '" + status + "' -> '" + firebaseStatus + "'");
                            // Mapping Firestore → Base de données
                            if (firebaseStatus.contains("danger")) {
                                statusToUse = "nouveau"; // Les dangers importants sont nouveaux
                                System.out.println("    Résultat: 'nouveau' (dangerous)");
                            } else if (firebaseStatus.contains("cours") || firebaseStatus.contains("en_cours") || firebaseStatus.contains("ongoing")) {
                                statusToUse = "en_cours";
                                System.out.println("    Résultat: 'en_cours'");
                            } else if (firebaseStatus.contains("resolu") || firebaseStatus.contains("resolved") || firebaseStatus.contains("fixed")) {
                                statusToUse = "resolu";
                                System.out.println("    Résultat: 'resolu'");
                            } else if (firebaseStatus.contains("rejete") || firebaseStatus.contains("rejected") || firebaseStatus.contains("reject")) {
                                statusToUse = "rejete";
                                System.out.println("    Résultat: 'rejete'");
                            }
                        }
                        
                        System.out.println("Statut final à utiliser: " + statusToUse);

                        // Convertir en final pour la lambda
                        final String finalStatusToUse = statusToUse;
                        
                        var statusSignalement = statusSignalementRepository
                                .findByLibelle(finalStatusToUse)
                                .orElseGet(() -> {
                                    System.out.println("⚠️  Statut '" + finalStatusToUse + "' non trouvé, utilisation du statut 'nouveau'");
                                    return statusSignalementRepository.findByLibelle("nouveau").orElse(null);
                                });

                        if (statusSignalement != null) {
                            System.out.println("✓ StatusSignalement trouvé: " + statusSignalement.getLibelle());
                            
                            SignalementStatus signalStatus = SignalementStatus.builder()
                                    .signalement(saved)
                                    .statusSignalement(statusSignalement)
                                    .updatedAt(Instant.now())
                                    .build();
                            statusRepository.save(signalStatus);
                            System.out.println("✓ Status créé et sauvegardé");
                            count++;
                            System.out.println("✓ Signalement importé avec succès! (Total: " + count + ")");
                        } else {
                            System.out.println("❌ ERREUR: StatusSignalement null pour '" + finalStatusToUse + "'");
                        }
                    } else {
                        System.out.println("❌ Document incomplet:");
                        System.out.println("   description: " + (description == null ? "NULL" : "OK"));
                        System.out.println("   lat: " + (lat == null ? "NULL" : "OK"));
                        System.out.println("   lng: " + (lng == null ? "NULL" : "OK"));
                    }
                } catch (Exception e) {
                    System.err.println("❌ ERREUR lors de la synchronisation du document: " + e.getMessage());
                    e.printStackTrace();
                }
            }

            System.out.println("Synchronisation terminée: " + count + " signalements importés");
            return count;
        } catch (java.util.concurrent.TimeoutException e) {
            System.err.println("TIMEOUT: Firestore n'a pas répondu après 30 secondes");
            System.out.println("Retour 0 synchronisé (timeout Firestore)");
            return 0;
        } catch (com.google.api.gax.rpc.UnavailableException e) {
            System.err.println("Firestore indisponible - Credentials invalides ou pas de connexion");
            System.out.println("Retour 0 synchronisé (Firestore indisponible)");
            return 0;
        } catch (Exception e) {
            System.err.println("Erreur lors de la synchronisation Firebase: " + e.getMessage());
            e.printStackTrace();
            System.out.println("Retour 0 synchronisé (erreur)");
            return 0;
        }
    }

    public void addWork(Long signalementId, Map<String, Object> workData) throws Exception {
        try {
            Signalement signalement = repository.findById(signalementId)
                    .orElseThrow(() -> new Exception("Signalement non trouvé"));

            // Mettre à jour la surface
            if (workData.containsKey("surface") && workData.get("surface") != null) {
                Double surface = ((Number) workData.get("surface")).doubleValue();
                signalement.setSurface(BigDecimal.valueOf(surface));
            }

            // Sauvegarder le signalement d'abord
            repository.save(signalement);

            // Récupérer l'entreprise par ID
            Long companyId = null;
            if (workData.containsKey("companyId")) {
                Object companyIdObj = workData.get("companyId");
                if (companyIdObj instanceof Number) {
                    companyId = ((Number) companyIdObj).longValue();
                } else if (companyIdObj instanceof String) {
                    companyId = Long.parseLong((String) companyIdObj);
                }
            }

            if (companyId == null) {
                throw new Exception("L'ID de l'entreprise est obligatoire");
            }

            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new Exception("Entreprise non trouvée"));

            // Créer le SignalementWork
            LocalDate startDate = null;
            LocalDate endDate = null;

            if (workData.containsKey("startDate") && workData.get("startDate") != null) {
                String startDateStr = (String) workData.get("startDate");
                if (!startDateStr.isEmpty()) {
                    startDate = LocalDate.parse(startDateStr);
                }
            }

            if (workData.containsKey("endDate") && workData.get("endDate") != null) {
                String endDateStr = (String) workData.get("endDate");
                if (!endDateStr.isEmpty()) {
                    endDate = LocalDate.parse(endDateStr);
                }
            }

            SignalementWork work = SignalementWork.builder()
                    .signalement(signalement)
                    .company(company)
                    .startDate(startDate)
                    .endDateEstimation(endDate)
                    .price(BigDecimal.valueOf(((Number) workData.get("price")).doubleValue()))
                    .build();

            workRepository.save(work);

            // Mettre à jour le statut à "en_cours"
            String status = (String) workData.getOrDefault("status", "en_cours");
            var statusSignalement = statusSignalementRepository.findByLibelle(status)
                    .orElseThrow(() -> new Exception("Statut invalide: " + status));

            SignalementStatus signalStatus = SignalementStatus.builder()
                    .signalement(signalement)
                    .statusSignalement(statusSignalement)
                    .updatedAt(Instant.now())
                    .build();

            statusRepository.save(signalStatus);
        } catch (Exception e) {
            System.err.println("Erreur dans addWork: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public void syncToFirebase(Long signalementId) throws Exception {
        try {
            Signalement signalement = repository.findById(signalementId)
                    .orElseThrow(() -> new Exception("Signalement non trouvé"));

            Firestore db = firebaseService.getFirestore();
            if (db == null) {
                throw new Exception("Firebase n'est pas initialisé");
            }

            // Récupérer le dernier statut
            SignalementStatus latestStatus = signalement.getStatuses().stream().findFirst().orElse(null);
            String status = latestStatus != null ? latestStatus.getStatusSignalement().getLibelle() : "nouveau";

            // Récupérer le dernier work s'il existe
            SignalementWork latestWork = signalement.getWorks().stream().findFirst().orElse(null);

            // Extraire lat et lng depuis location
            String[] coords = signalement.getLocation().split(",");
            double lat = Double.parseDouble(coords[0].trim());
            double lng = Double.parseDouble(coords[1].trim());

            // Préparer les données à synchroniser
            Map<String, Object> data = new java.util.HashMap<>();
            data.put("description", signalement.getDescriptions());
            data.put("lat", lat);
            data.put("lng", lng);
            data.put("status", status);
            data.put("lastUpdated", Instant.now().toString());

            // Ajouter les informations de travail si elles existent
            if (latestWork != null) {
                Map<String, Object> workData = new java.util.HashMap<>();
                workData.put("surface", signalement.getSurface() != null ? signalement.getSurface().doubleValue() : null);
                workData.put("company", latestWork.getCompany().getName());
                workData.put("companyId", latestWork.getCompany().getId());
                workData.put("startDate", latestWork.getStartDate() != null ? latestWork.getStartDate().toString() : null);
                workData.put("endDateEstimation", latestWork.getEndDateEstimation() != null ? latestWork.getEndDateEstimation().toString() : null);
                workData.put("realEndDate", latestWork.getRealEndDate() != null ? latestWork.getRealEndDate().toString() : null);
                workData.put("price", latestWork.getPrice() != null ? latestWork.getPrice().doubleValue() : null);
                data.put("work", workData);
            }

            // Si le signalement a un firebaseId, mettre à jour le document existant
            // Sinon, créer un nouveau document
            String firebaseId = signalement.getFirebaseId();
            if (firebaseId != null && !firebaseId.isEmpty()) {
                db.collection("roadworks_reports").document(firebaseId).set(data).get();
            } else {
                // Créer un nouveau document et sauvegarder son ID
                var docRef = db.collection("roadworks_reports").add(data).get();
                signalement.setFirebaseId(docRef.getId());
                repository.save(signalement);
            }

        } catch (Exception e) {
            System.err.println("Erreur dans syncToFirebase: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
