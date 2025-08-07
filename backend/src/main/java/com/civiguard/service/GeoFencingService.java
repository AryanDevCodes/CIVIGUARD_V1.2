
package com.civiguard.service;

import com.civiguard.dto.geofence.GeoFencePointResponse;
import com.civiguard.dto.geofence.GeoFenceRequest;
import com.civiguard.dto.geofence.GeoFenceResponse;
import com.civiguard.exception.BadRequestException;
import com.civiguard.exception.ResourceNotFoundException;
import com.civiguard.model.GeoFence;
import com.civiguard.model.GeoFencePoint;
import com.civiguard.model.Location;
import com.civiguard.model.User;
import com.civiguard.repository.GeoFenceRepository;
import com.civiguard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing geofencing operations.
 */

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoFencingService {

    private final GeoFenceRepository geoFenceRepository;
    private final UserRepository userRepository;
    
    @Value("${app.geofencing.enabled}")
    private boolean geofencingEnabled;
    
    @Value("${app.geofencing.max-fence-radius-km}")
    private double maxFenceRadiusKm;

    @Transactional
    public GeoFenceResponse createGeoFence(GeoFenceRequest request, Long userId) {
        if (!geofencingEnabled) {
            throw new BadRequestException("Geofencing is not enabled");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        validateGeoFenceRequest(request);
        
        GeoFence geoFence = new GeoFence();
        geoFence.setName(request.getName());
        geoFence.setDescription(request.getDescription());
        geoFence.setType(request.getType());
        geoFence.setPurpose(request.getPurpose());
        geoFence.setStartTime(request.getStartTime());
        geoFence.setEndTime(request.getEndTime());
        geoFence.setActive(true);
        geoFence.setCreatedBy(user);
        
        if (request.getType() == GeoFence.FenceType.CIRCLE) {
            geoFence.setCenter(request.getCenter());
            geoFence.setRadiusKm(request.getRadiusKm());
        } else if (request.getType() == GeoFence.FenceType.POLYGON) {
            // Convert Location list to GeoFencePoint list with order
            List<GeoFencePoint> polygonPoints = new ArrayList<>();
            int order = 0;
            for (Location location : request.getPolygonPoints()) {
                GeoFencePoint point = new GeoFencePoint();
                point.setLocation(location);
                point.setPointOrder(order++);
                point.setGeofence(geoFence);
                polygonPoints.add(point);
            }
            geoFence.setPolygonPoints(polygonPoints);
        }
        
        GeoFence savedGeoFence = geoFenceRepository.save(geoFence);
        return mapToResponse(savedGeoFence);
    }

    @Transactional(readOnly = true)
    public GeoFenceResponse getGeoFenceById(Long id) {
        GeoFence geoFence = geoFenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence", "id", id));
        return mapToResponse(geoFence);
    }

    @Transactional(readOnly = true)
    public List<GeoFenceResponse> getAllActiveGeoFences() {
        return geoFenceRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GeoFenceResponse> getActiveGeoFencesByType(GeoFence.FenceType type) {
        return geoFenceRepository.findByTypeAndIsActiveTrue(type).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GeoFenceResponse> getActiveGeoFencesByPurpose(GeoFence.FencePurpose purpose) {
        return geoFenceRepository.findByPurposeAndIsActiveTrue(purpose).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GeoFenceResponse deactivateGeoFence(Long id) {
        GeoFence geoFence = geoFenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence", "id", id));
        
        geoFence.setActive(false);
        GeoFence savedGeoFence = geoFenceRepository.save(geoFence);
        return mapToResponse(savedGeoFence);
    }

    @Transactional(readOnly = true)
    public boolean isPointInAnyActiveFence(Location point) {
        List<GeoFence> activeGeoFences = geoFenceRepository.findByIsActiveTrue();
        
        for (GeoFence fence : activeGeoFences) {
            if (isPointInFence(point, fence)) {
                return true;
            }
        }
        
        return false;
    }

    @Transactional(readOnly = true)
    public List<GeoFenceResponse> findActiveGeoFencesContainingPoint(Location point) {
        List<GeoFence> activeGeoFences = geoFenceRepository.findByIsActiveTrue();
        
        return activeGeoFences.stream()
                .filter(fence -> isPointInFence(point, fence))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private boolean isPointInFence(Location point, GeoFence fence) {
        if (fence.getType() == GeoFence.FenceType.CIRCLE) {
            return isPointInCircle(point, fence.getCenter(), fence.getRadiusKm());
        } else if (fence.getType() == GeoFence.FenceType.POLYGON) {
            return isPointInPolygon(point, fence.getPolygonPoints());
        }
        return false;
    }

    private boolean isPointInCircle(Location point, Location center, double radiusKm) {
        double distance = calculateDistance(point.getLatitude(), point.getLongitude(), 
                center.getLatitude(), center.getLongitude());
        return distance <= radiusKm;
    }

    private boolean isPointInPolygon(Location point, List<GeoFencePoint> geoFencePoints) {
        // This is a simplified implementation of the ray-casting algorithm
        // A more accurate implementation would be needed for production use
        
        boolean inside = false;
        int j = geoFencePoints.size() - 1;
        
        for (int i = 0; i < geoFencePoints.size(); i++) {
            Location p1 = geoFencePoints.get(i).getLocation();
            Location p2 = geoFencePoints.get(j).getLocation();
            
            if ((p1.getLongitude() > point.getLongitude()) != (p2.getLongitude() > point.getLongitude()) &&
                (point.getLatitude() < (p2.getLatitude() - p1.getLatitude()) * 
                (point.getLongitude() - p1.getLongitude()) / 
                (p2.getLongitude() - p1.getLongitude()) + p1.getLatitude())) {
                inside = !inside;
            }
            j = i;
        }
        
        return inside;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula to calculate distance between two points
        double earthRadiusKm = 6371;
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2) + 
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * 
                   Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
                   
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return earthRadiusKm * c;
    }

    private void validateGeoFenceRequest(GeoFenceRequest request) {
        if (request.getType() == GeoFence.FenceType.CIRCLE) {
            if (request.getCenter() == null) {
                throw new BadRequestException("Center location is required for circle geofence");
            }
            
            if (request.getRadiusKm() == null || request.getRadiusKm() <= 0) {
                throw new BadRequestException("Valid radius is required for circle geofence");
            }
            
            if (request.getRadiusKm() > maxFenceRadiusKm) {
                throw new BadRequestException("Fence radius cannot exceed " + maxFenceRadiusKm + " km");
            }
        } else if (request.getType() == GeoFence.FenceType.POLYGON) {
            if (request.getPolygonPoints() == null || request.getPolygonPoints().size() < 3) {
                throw new BadRequestException("At least 3 points are required for polygon geofence");
            }
        } else {
            throw new BadRequestException("Invalid geofence type");
        }
    }

    private GeoFenceResponse mapToResponse(GeoFence geoFence) {
        GeoFenceResponse response = new GeoFenceResponse();
        response.setId(geoFence.getId());
        response.setName(geoFence.getName());
        response.setDescription(geoFence.getDescription());
        response.setType(geoFence.getType());
        response.setRadiusKm(geoFence.getRadiusKm());
        response.setCenter(geoFence.getCenter());
        
        // Convert GeoFencePoint list to GeoFencePointResponse list using the fromEntity method
        if (geoFence.getPolygonPoints() != null) {
            List<GeoFencePointResponse> pointResponses = geoFence.getPolygonPoints().stream()
                .map(GeoFencePointResponse::fromEntity)
                .collect(Collectors.toList());
            response.setPolygonPoints(pointResponses);
        }
        
        response.setPurpose(geoFence.getPurpose());
        response.setStartTime(geoFence.getStartTime());
        response.setEndTime(geoFence.getEndTime());
        response.setActive(geoFence.isActive());
        
        if (geoFence.getCreatedBy() != null) {
            GeoFenceResponse.UserSummary userSummary = new GeoFenceResponse.UserSummary();
            userSummary.setId(geoFence.getCreatedBy().getId());
            userSummary.setName(geoFence.getCreatedBy().getName());
            userSummary.setEmail(geoFence.getCreatedBy().getEmail());
            response.setCreatedBy(userSummary);
        }
        
        return response;
    }
}
