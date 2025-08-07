package com.civiguard.bootstrap;

import com.civiguard.model.*;
import com.civiguard.model.Location;
import com.civiguard.model.Shift;
import com.civiguard.model.ShiftType;
import com.civiguard.model.ShiftStatus;
import com.civiguard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Profile("dev")
@Slf4j
public class InitialDataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SystemStatusRepository systemStatusRepository;
    private final OfficerRepository officerRepository;
    private final IncidentRepository incidentRepository;
    private final AlertRepository alertRepository;
    private final DisasterAlertRepository disasterAlertRepository;
    private final GeoFenceRepository geoFenceRepository;
    private final PatrolVehicleRepository patrolVehicleRepository;
    private final WeatherDataRepository weatherDataRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReportRepository reportRepository;
    private final PatrolRouteRepository patrolRouteRepository;
    private final ShiftRepository shiftRepository;

    // Madhya Pradesh districts, prioritizing Bhopal
    private final String[] districts = {
        "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Rewa", "Satna",
        "Dhar", "Chhindwara", "Morena", "Betul", "Sehore", "Raisen", "Vidisha",
        "Hoshangabad", "Shahdol", "Ratlam", "Tikamgarh", "Dewas", "Mandsaur",
        "Khandwa", "Khargone", "Balaghat", "Chhatarpur", "Shivpuri", "Narsinghpur",
        "Neemuch", "Panna", "Damoh", "Sidhi", "Singrauli"
    };

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting data initialization...");

        // Create users first
        List<User> users = createUsers();

        // Create system status components
        createInitialSystemComponents();

        // Create officers
        List<Officer> officers = createOfficers(users);

        // Create reports before incidents as incidents may reference them
        createReports();

        // Create incidents (after reports since they may reference them)
        createIncidents(users, officers);

        // Create alerts
        createAlerts(users);

        // Create disaster alerts
        createDisasterAlerts(users);

        // Create geofences
        createGeoFences(users);

        // Create patrol vehicles
        createPatrolVehicles(officers);

        // Create patrol routes
        createPatrolRoutes(patrolVehicleRepository.findAll(), officers);

        // Create weather data
        createWeatherData();
        createSampleShifts();
        log.info("Data initialization completed successfully!");
    }

    private List<User> createUsers() {
        if (userRepository.count() > 0) {
            log.info("Users already exist, skipping user creation");
            return userRepository.findAll();
        }

        List<User> users = new ArrayList<>();

        // Create admin user
        User adminUser = new User();
        adminUser.setName("Admin User");
        adminUser.setEmail("admin@civiguard.com");
        adminUser.setPassword(passwordEncoder.encode("adminPassword123"));
        adminUser.setRole(User.Role.ADMIN);
        adminUser.setActive(true);
        adminUser.setLastLogin(LocalDateTime.now());
        adminUser.setVerificationStatus(User.VerificationStatus.VERIFIED);
        adminUser.setAadhaar("999999999999");
        users.add(adminUser);

        // Create 50 officer users (one for each officer)
        for (int i = 1; i <= 50; i++) {
            User officerUser = new User();
            officerUser.setName("Officer " + i);
            
            // Generate unique email
            String email = "officer" + i + "@civiguard.com";
            officerUser.setEmail(email);
            
            officerUser.setPassword(passwordEncoder.encode("officer123"));
            officerUser.setRole(User.Role.OFFICER);
            officerUser.setActive(true);
            
            // Generate unique Aadhaar number (12 digits starting with 9)
            String aadhaar = String.format("%012d", 900000000000L + i);
            officerUser.setAadhaar(aadhaar);
            
            // Generate unique phone number starting with 9
            String phoneNumber = "9" + String.format("%09d", i);
            officerUser.setPhoneNumber(phoneNumber);

            // Set address
            Address address = new Address();
            address.setStreet("Police Line " + i);
            address.setCity(getRandomCity());
            address.setState("Madhya Pradesh");
            address.setPostalCode(String.format("%06d", 462000 + (i % 50))); // Bhopal PIN range
            address.setCountry("India");
            officerUser.setAddress(address);

            officerUser.setVerificationStatus(User.VerificationStatus.VERIFIED);
            users.add(officerUser);
        }

        // Create 20 citizen users
        for (int i = 1; i <= 20; i++) {
            User citizenUser = new User();
            citizenUser.setName("Citizen " + i);
            citizenUser.setEmail("citizen" + i + "@civiguard.com");
            citizenUser.setPassword(passwordEncoder.encode("citizen123"));
            citizenUser.setRole(User.Role.CITIZEN);
            citizenUser.setActive(true);
            citizenUser.setAadhaar(String.format("%012d", 800000000000L + i));
            citizenUser.setPhoneNumber("8" + String.format("%09d", i));

            Address address = new Address();
            address.setStreet("Resident Street " + i);
            address.setCity(getRandomCity());
            address.setState("Madhya Pradesh");
            address.setPostalCode(String.format("%06d", new Random().nextInt(999999)));
            address.setCountry("India");
            citizenUser.setAddress(address);

            // Add emergency contacts
            List<EmergencyContact> contacts = new ArrayList<>();
            for (int j = 1; j <= 2; j++) {
                EmergencyContact contact = new EmergencyContact();
                contact.setName("Emergency Contact " + j + " for Citizen " + i);
                contact.setRelationship(j == 1 ? "Family" : "Friend");
                contact.setPhoneNumber("7" + String.format("%09d", i * 10 + j));
                contact.setUser(citizenUser);
                contacts.add(contact);
            }
            citizenUser.setEmergencyContacts(contacts);

            // For demo: half citizens verified, half unverified
            if (i % 2 == 0) {
                citizenUser.setVerificationStatus(User.VerificationStatus.VERIFIED);
            } else {
                citizenUser.setVerificationStatus(User.VerificationStatus.UNVERIFIED);
            }
            users.add(citizenUser);
        }

        userRepository.saveAll(users);
        log.info("Created {} users", users.size());
        return users;
    }

    private void createInitialSystemComponents() {
        if (systemStatusRepository.count() > 0) {
            log.info("System components already exist, skipping system component creation");
            return;
        }

        List<SystemStatus> components = Arrays.asList(
            createComponent("Authentication", SystemStatus.ComponentStatus.OPERATIONAL, "User authentication service", "1.0.0"),
            createComponent("Incident Reporting", SystemStatus.ComponentStatus.OPERATIONAL, "Incident reporting and management", "1.0.0"),
            createComponent("Officer Management", SystemStatus.ComponentStatus.OPERATIONAL, "Officer profiles and assignments", "1.0.0"),
            createComponent("Notifications", SystemStatus.ComponentStatus.OPERATIONAL, "User notification system", "1.0.0"),
            createComponent("File Storage", SystemStatus.ComponentStatus.OPERATIONAL, "Image and document storage", "1.0.0"),
            createComponent("Weather Service", SystemStatus.ComponentStatus.OPERATIONAL, "Weather data integration", "1.0.0"),
            createComponent("GeoFencing", SystemStatus.ComponentStatus.OPERATIONAL, "Location-based boundary service", "1.0.0"),
            createComponent("Vehicle Tracking", SystemStatus.ComponentStatus.OPERATIONAL, "Patrol vehicle monitoring", "1.0.0"),
            createComponent("Emergency Alerts", SystemStatus.ComponentStatus.OPERATIONAL, "Critical situation notifications", "1.0.0"),
            createComponent("Analytics Engine", SystemStatus.ComponentStatus.DEGRADED, "Data analysis and reporting", "0.9.0")
        );

        systemStatusRepository.saveAll(components);
        log.info("Created {} system components", components.size());
    }

    private List<Officer> createOfficers(List<User> users) {
        if (officerRepository.count() > 0) {
            log.info("Officers already exist, skipping officer creation");
            return officerRepository.findAll();
        }

        List<Officer> officers = new ArrayList<>();
        // Get all officer users and sort them for consistent assignment
        List<User> officerUsers = users.stream()
                .filter(user -> user.getRole() == User.Role.OFFICER)
                .sorted(Comparator.comparing(User::getEmail))
                .toList();
                
        if (officerUsers.size() < 50) {
            throw new IllegalStateException("Not enough officer users. Expected at least 50, found " + officerUsers.size());
        }

        // Realistic police departments and specializations with designations
        String[][] departments = {
            // Department, Specialization, Designation
            {"Traffic Police", "Traffic Management", "Traffic Sub-Inspector"},
            {"Crime Branch", "Homicide", "Investigation Officer"},
            {"Cyber Crime", "Digital Forensics", "Cyber Crime Investigator"},
            {"Special Task Force", "Anti-Terrorism", "STF Officer"},
            {"Women Safety Wing", "Domestic Violence", "Women Protection Officer"},
            {"Narcotics Control Bureau", "Drug Enforcement", "NCB Inspector"},
            {"Crime Investigation Department", "Organized Crime", "CID Inspector"},
            {"Anti-Corruption Bureau", "White Collar Crime", "ACB Inspector"},
            {"Highway Patrol", "Road Safety", "Highway Patrol Officer"},
            {"Juvenile Justice", "Child Protection", "Juvenile Welfare Officer"},
            {"Traffic Police", "Accident Investigation", "Traffic Inspector"},
            {"Crime Branch", "Property Crime", "Sub-Inspector"},
            {"Cyber Crime", "Financial Fraud", "Cyber Crime Analyst"},
            {"Special Operations Group", "Hostage Rescue", "SOG Commando"},
            {"Forensic Science Lab", "Crime Scene Investigation", "Forensic Expert"}
        };

        // More diverse Indian names
        String[] firstNames = {
            "Rajesh", "Priya", "Amit", "Neha", "Vikram", "Ananya", "Rahul", "Meera", "Arjun", "Kavita",
            "Sandeep", "Pooja", "Vijay", "Shweta", "Ravi", "Divya", "Sanjay", "Anjali", "Rajiv", "Sneha",
            "Akhil", "Deepika", "Rohit", "Kiran", "Nikhil", "Priyanka", "Vishal", "Monica", "Karan", "Ishita"
        };
        
        String[] lastNames = {
            "Verma", "Patel", "Sharma", "Singh", "Yadav", "Kumar", "Gupta", "Reddy", "Nair", "Iyer",
            "Malhotra", "Choudhary", "Joshi", "Desai", "Mehta", "Bose", "Banerjee", "Chatterjee", "Mukherjee", "Dasgupta"
        };
        
        // Blood groups with distribution
        String[] bloodGroups = {"O+", "O+", "O+", "O+", "O-", "A+", "A+", "A-", "B+", "B+", "B-", "AB+", "AB-"};
        
        // Police stations across different areas with contact info
        String[][] policeStations = {
            {"TT Nagar Police Station", "TT Nagar, Bhopal", "0755-2551111"},
            {"Jehangirabad Police Station", "Jehangirabad, Bhopal", "0755-2552222"},
            {"Kohefiza Police Station", "Kohefiza, Bhopal", "0755-2553333"},
            {"Gandhi Nagar Police Station", "Gandhi Nagar, Bhopal", "0755-2554444"},
            {"M.P. Nagar Police Station", "M.P. Nagar, Bhopal", "0755-2555555"},
            {"Shahjehanabad Police Station", "Shahjehanabad, Bhopal", "0755-2556666"},
            {"Ashoka Garden Police Station", "Ashoka Garden, Bhopal", "0755-2557777"},
            {"Mata Mandir Police Station", "Mata Mandir, Bhopal", "0755-2558888"},
            {"Bairagarh Police Station", "Bairagarh, Bhopal", "0755-2559999"},
            {"Nayapura Police Station", "Nayapura, Bhopal", "0755-2550000"}
        };
        
        // Areas in Bhopal for addresses
        String[] areas = {
            "Arera Colony", "Shyamla Hills", "Char Imli", "Bittan Market", "10 No. Stop",
            "New Market", "Barkheda", "Kolar Road", "Bairagarh", "Hoshangabad Road",
            "Kolar Road", "BHEL", "Ayodhya Bypass", "Misrod", "Berasia"
        };

        Random random = new Random();
        
        // Create 50 officers with realistic profiles
        for (int i = 0; i < 50; i++) {
            Officer officer = new Officer();
            
            // Generate realistic name with proper Indian naming conventions
            String firstName = firstNames[random.nextInt(firstNames.length)];
            String lastName = lastNames[random.nextInt(lastNames.length)];
            String fullName = firstName + " " + lastName;
            
            officer.setName(fullName);
            officer.setBadgeNumber("MP" + String.format("%04d", 1000 + i)); // MP1001, MP1002, etc.


            // Assign rank based on experience (years of service)
            int yearsOfService = 1 + (i % 30); // 1-30 years of service
            Officer.Rank rank;
            String[] rankSpecificDesignations;
            
            if (yearsOfService < 3) {
                rank = Officer.Rank.CONSTABLE;
                rankSpecificDesignations = new String[]{"Constable", "Constable (Armed)", "Constable (Driver)", "Constable (Wireless)"};
            } else if (yearsOfService < 7) {
                rank = Officer.Rank.HEAD_CONSTABLE;
                rankSpecificDesignations = new String[]{"Head Constable", "Head Constable (Armed)", "Head Constable (Driver)", "Head Constable (Wireless)"};
            } else if (yearsOfService < 10) {
                rank = Officer.Rank.ASSISTANT_SUB_INSPECTOR;
                rankSpecificDesignations = new String[]{"Assistant Sub-Inspector", "ASI (Investigation)", "ASI (Traffic)", "ASI (Armed)"};
            } else if (yearsOfService < 15) {
                rank = Officer.Rank.SUB_INSPECTOR;
                rankSpecificDesignations = new String[]{"Sub-Inspector", "SI (Investigation)", "SI (Traffic)", "SI (Armed)", "Station House Officer"};
            } else if (yearsOfService < 20) {
                rank = Officer.Rank.INSPECTOR;
                rankSpecificDesignations = new String[]{"Inspector", "Inspector (Crime)", "Inspector (Traffic)", "Inspector (Armed)", "Station House Officer"};
            } else {
                rank = Officer.Rank.DEPUTY_SUPERINTENDENT;
                rankSpecificDesignations = new String[]{"Deputy Superintendent of Police", "DSP (Crime)", "DSP (Traffic)", "DSP (Armed)", "DSP (HQ)"};
            }
            officer.setRank(rank);

            // Assign department and specialization
            String[] deptInfo = departments[random.nextInt(departments.length)];
            officer.setDepartment(deptInfo[0]);
            
            // Set additional fields with realistic data
            String designation = deptInfo[2];
            // Make designation rank-specific if needed
            if (designation.contains("Inspector") || designation.contains("Officer")) {
                designation = rankSpecificDesignations[random.nextInt(rankSpecificDesignations.length)];
            }
            officer.setDesignation(designation);
            officer.setSpecialization(deptInfo[1]);
            
            // Generate realistic weapon number (format: WP[year][4 digits])
            int currentYear = LocalDate.now().getYear();
            int weaponYear = currentYear - random.nextInt(10); // Weapons from last 10 years
            officer.setWeaponNumber("WP" + weaponYear + String.format("%04d", random.nextInt(10000)));
            
            // Set blood group with realistic distribution
            officer.setBloodGroup(bloodGroups[random.nextInt(bloodGroups.length)]);
            
            // Set emergency contact (family member's number)
            String[] familyPrefixes = {"98", "97", "99", "96", "89", "88", "87"};
            String emergencyContact = familyPrefixes[random.nextInt(familyPrefixes.length)] + 
                                    String.format("%08d", random.nextInt(100000000));
            officer.setEmergencyContact(emergencyContact);
            
            // Set current posting with full details
            String[] currentStation = policeStations[random.nextInt(policeStations.length)];
            officer.setCurrentPosting(currentStation[0] + " (" + currentStation[1] + ")");
            
            // Set previous postings (0-3 random postings)
            List<String> previousPostings = new ArrayList<>();
            int numPreviousPostings = random.nextInt(4); // 0 to 3 previous postings
            for (int j = 0; j < numPreviousPostings; j++) {
                String[] prevStation = policeStations[random.nextInt(policeStations.length)];
                String posting = prevStation[0] + " (" + prevStation[1] + ")";
                if (!posting.equals(officer.getCurrentPosting()) && !previousPostings.contains(posting)) {
                    previousPostings.add(posting);
                }
            }
            officer.setPreviousPostings(previousPostings);
            
            // Set dates with realistic age progression
            LocalDate joinDate = LocalDate.now().minusYears(yearsOfService)
                    .minusMonths(random.nextInt(12))
                    .minusDays(random.nextInt(30));
                    
            // Age at joining: 20-25 years
            int ageAtJoining = 20 + random.nextInt(6);
            LocalDate dob = joinDate.minusYears(ageAtJoining)
                                 .minusMonths(random.nextInt(12))
                                 .minusDays(random.nextInt(30));
            
            officer.setJoinDate(joinDate);
            officer.setDateOfBirth(dob);
            
            // Set contact information with realistic Indian numbers
            String[] mobilePrefixes = {"98", "97", "99", "96", "89", "88", "87", "78", "77", "76"};
            String mobileNumber = "9" + mobilePrefixes[random.nextInt(mobilePrefixes.length)] + 
                                String.format("%08d", random.nextInt(100000000));
            officer.setContactNumber(mobileNumber);
            
            // Use the same email as the corresponding user account
            String email = officerUsers.get(i).getEmail();
            officer.setEmail(email);
            
            // Set realistic address
            String area = areas[random.nextInt(areas.length)];
            String[] streetTypes = {"Road", "Street", "Nagar", "Colony", "Vihar", "Pura", "Ganj", "Chowk", "Marg"};
            String streetName = area.split(" ")[0] + " " + streetTypes[random.nextInt(streetTypes.length)];
            
            String address = String.format("%d, %s, %s\nBhopal, Madhya Pradesh %d",
                random.nextInt(200) + 1, // House number
                streetName,
                area,
                462000 + random.nextInt(50) // Pincode range for Bhopal
            );
            officer.setAddress(address);
            
            // Set status with realistic distribution
            int statusRoll = random.nextInt(100);
            if (statusRoll < 5) { // 5% chance
                officer.setStatus(Officer.OfficerStatus.SUSPENDED);
            } else if (statusRoll < 15) { // 10% chance
                officer.setStatus(Officer.OfficerStatus.ON_LEAVE);
            } else if (statusRoll < 25) { // 10% chance
                officer.setStatus(Officer.OfficerStatus.IN_TRAINING);
            } else if (statusRoll < 50) { // 25% chance
                officer.setStatus(Officer.OfficerStatus.ON_PATROL);
            } else {
                officer.setStatus(Officer.OfficerStatus.ACTIVE); // 50% chance
            }
            
            // Set district with realistic distribution
            if (i % 5 == 0 && i < districts.length) {
                // 20% chance of being from another district
                officer.setDistrict(districts[i % districts.length]);
            } else {
                // 80% chance of being from Bhopal
                officer.setDistrict(districts[0]);
            }
            
            // Set performance metrics with realistic distributions
            OfficerPerformance perf = new OfficerPerformance();
            
            // Base metrics on years of service with some randomness
            double performanceMultiplier = 0.8 + (random.nextDouble() * 0.4); // 0.8 to 1.2
            
            // Cases solved: more for experienced officers
            perf.setCasesSolved((int)(yearsOfService * (5 + random.nextInt(5)) * performanceMultiplier));
            
            // Commendations: more for better performance
            perf.setCommendations((int)((yearsOfService / 2.0 + random.nextInt(3)) * performanceMultiplier));
            
            // Incidents reported: more for field officers
            boolean isFieldOfficer = random.nextBoolean();
            perf.setIncidentsReported(isFieldOfficer ? 
                (int)(yearsOfService * (8 + random.nextInt(10)) * performanceMultiplier) :
                (int)(yearsOfService * (3 + random.nextInt(5)) * performanceMultiplier));
            
            // Set performance rating based on metrics
            perf.updatePerformanceRating();
            
            // Last promotion: at least 1 year ago, at most yearsOfService/2 years ago
            int yearsSincePromotion = 1 + random.nextInt(Math.max(1, yearsOfService / 2));
            perf.setLastPromotionDate(LocalDate.now().minusYears(yearsSincePromotion)
                    .minusMonths(random.nextInt(12))
                    .minusDays(random.nextInt(30)));
            
            // Awards: more for better performance
            perf.setAwardsReceived((int)((yearsOfService / 3.0 + random.nextInt(3)) * performanceMultiplier));
            
            // Disciplinary actions: fewer for better performance
            perf.setDisciplinaryActions((int)((random.nextInt(Math.max(1, yearsOfService / 2))) * 
                                          (1.2 - performanceMultiplier)));
            
            // Training hours: more for specialized roles
            boolean isSpecialized = deptInfo[1].contains("Crime") || 
                                  deptInfo[1].contains("Forensic") ||
                                  deptInfo[1].contains("Terrorism");
            int baseTrainingHours = isSpecialized ? 40 : 20;
            perf.setTrainingHoursCompleted((int)(yearsOfService * (baseTrainingHours + random.nextInt(20)) * 
                                             performanceMultiplier));
            
            // Engagement and leadership scores
            perf.setCommunityEngagementScore(40 + (int)(50 * performanceMultiplier) + random.nextInt(20));
            perf.setTeamLeadershipScore(40 + (int)(50 * performanceMultiplier) + random.nextInt(20));
            
            // Update performance rating based on all metrics
            perf.updatePerformanceRating();
            
            officer.setPerformance(perf);

            // Assign a unique user to each officer
            User officerUser = officerUsers.get(i);
            officer.setUser(officerUser);
            
            // Update officer's email to match user's email if different
            if (!officer.getEmail().equalsIgnoreCase(officerUser.getEmail())) {
                officer.setEmail(officerUser.getEmail());
            }

            officers.add(officer);
        }

        officerRepository.saveAll(officers);
        log.info("Created {} realistic officers with detailed profiles", officers.size());
        return officers;
    }

    private void createIncidents(List<User> users, List<Officer> officers) {
        if (incidentRepository.count() > 0) {
            log.info("Incidents already exist, skipping incident creation");
            return;
        }

        List<Incident> incidents = new ArrayList<>();
        String[] incidentTypes = {
            "Theft", "Assault", "Traffic Violation", "Cybercrime",
            "Domestic Violence", "Missing Person", "Public Disturbance",
            "Robbery", "Vandalism", "Drug Related", "Fraud"
        };

        String[][] tags = {
            {"property", "street", "night"},
            {"violent", "weapon", "injury"},
            {"vehicle", "speeding", "accident"},
            {"online", "hacking", "fraud"},
            {"family", "violence", "urgent"},
            {"person", "child", "search"},
            {"noise", "crowd", "public"},
            {"armed", "theft", "violence"},
            {"property damage", "graffiti", "public property"},
            {"narcotics", "dealing", "possession"},
            {"scam", "financial", "identity theft"}
        };

        List<User> citizenUsers = users.stream()
                .filter(user -> user.getRole() == User.Role.CITIZEN)
                .toList();
        
        // Generate incidents over the last 12 months, with a mix of statuses
        int months = 12;
        int incidentsPerMonth = 8;
        int total = months * incidentsPerMonth;
        for (int i = 0; i < total; i++) {
            Incident incident = new Incident();
            int typeIndex = i % incidentTypes.length;

            incident.setTitle(incidentTypes[typeIndex] + " Incident #" + (i+1));
            incident.setDescription("This is a detailed description for " + incidentTypes[typeIndex] +
                    " incident #" + (i+1) + ". The incident occurred at the specified location and requires attention.");

            // Set location near Bhopal
            Location location = new Location();
            location.setLatitude(23.2599 + (i % 15) * 0.001); // ~0.1 km variation
            location.setLongitude(77.4126 + (i % 10) * 0.001); // ~0.1 km variation
            location.setAddress("Incident Address #" + (i+1));
            location.setDistrict(districts[i % districts.length]);
            location.setCity(getRandomCity());
            location.setState("Madhya Pradesh");
            location.setPostalCode(String.format("%06d", 462000 + i)); // Bhopal PIN range
            location.setCountry("India");
            incident.setLocation(location);

            // Assign reporter
            boolean isAnonymous = i % 5 == 0;
            incident.setAnonymous(isAnonymous);
            if (!isAnonymous && !citizenUsers.isEmpty()) {
                incident.setReportedBy(citizenUsers.get(i % citizenUsers.size()));
            } else {
                incident.setReporterContactInfo("Anonymous Reporter #" + (i+1) + ", Contact: 98765" + String.format("%05d", i+1));
            }

            // Set status
            Incident.IncidentStatus[] statuses = Incident.IncidentStatus.values();
            incident.setStatus(statuses[i % statuses.length]);
            // Set priority
            Incident.IncidentPriority[] priorities = Incident.IncidentPriority.values();
            incident.setPriority(priorities[i % priorities.length]);
            incident.setIncidentType(incidentTypes[typeIndex]);
            // Add tags
            incident.setTags(new HashSet<>(Arrays.asList(tags[typeIndex])));
            // Add dummy images
            Set<String> images = new HashSet<>();
            int imageCount = (i % 3) + 1;
            for (int j = 0; j < imageCount; j++) {
                images.add("incident_" + (i+1) + "_image_" + (j+1) + ".jpg");
            }
            incident.setImages(images);
            // Set dates: spread over the last 12 months
            int monthOffset = i / incidentsPerMonth;
            int dayOfMonth = (i % 28) + 1;
            LocalDateTime reportDateTime = LocalDateTime.now().minusMonths(monthOffset).withDayOfMonth(Math.min(dayOfMonth, 28)).withHour(10 + (i % 8)).withMinute(0);
            
            // Initialize report details with current timestamp
            if (incident.getReportDetails() == null) {
                incident.setReportDetails(new Incident.ReportDetails());
            }
            // Set report date and time in report details
            incident.getReportDetails().setReportDate(reportDateTime.toLocalDate().toString());
            incident.getReportDetails().setReportTime(reportDateTime.toLocalTime().toString());
            incident.getReportDetails().setConversionNotes("Sample incident data for testing");
            
            if (incident.getStatus() == Incident.IncidentStatus.RESOLVED ||
                incident.getStatus() == Incident.IncidentStatus.CLOSED) {
                incident.setResolutionDate(reportDateTime.plusDays((i % 5) + 1));
                incident.setResolutionNotes("This incident has been resolved by taking appropriate actions.");
            }
            
            // Add report details for some incidents (approximately 30% of incidents will have report details)
            if (i % 3 == 0 && !reportRepository.findAll().isEmpty()) {
                // Get a random report to use as the source
                List<Report> allReports = reportRepository.findAll();
                Report sourceReport = allReports.get(i % allReports.size());
                
                // Create and set report details
                Incident.ReportDetails reportDetails = new Incident.ReportDetails();
                reportDetails.setWitnesses(sourceReport.getWitnesses());
                reportDetails.setEvidence(sourceReport.getEvidence());
                reportDetails.setReportDate(sourceReport.getDate());
                reportDetails.setReportTime(sourceReport.getTime());
                reportDetails.setOriginalDescription(sourceReport.getDescription());
                reportDetails.setOriginalType(sourceReport.getType());
                reportDetails.setOriginalStatus(sourceReport.getStatus());
                
                // Assign officers to incidents based on department and availability
                if (!officers.isEmpty()) {
                    // For testing, assign 1-3 officers to each incident
                    int numOfficers = 1 + (i % 3); // 1-3 officers per incident
                    Set<Officer> assignedOfficers = new HashSet<>();
                    
                    // Filter officers by district and status
                    List<Officer> availableOfficers = officers.stream()
                        .filter(o -> o.getDistrict().equals(incident.getLocation().getDistrict()))
                        .filter(o -> o.getStatus() == Officer.OfficerStatus.ACTIVE ||
                                   o.getStatus() == Officer.OfficerStatus.ON_PATROL ||
                                   o.getStatus() == Officer.OfficerStatus.IN_TRAINING)
                        .collect(Collectors.toList());
                    
                    // Assign officers if available
                    if (!availableOfficers.isEmpty()) {
                        for (int j = 0; j < Math.min(numOfficers, availableOfficers.size()); j++) {
                            Officer officer = availableOfficers.get((i + j) % availableOfficers.size());
                            assignedOfficers.add(officer);
                        }
                        incident.setAssignedOfficers(assignedOfficers);
                        
                        // Create incident updates for each assigned officer
                        for (Officer officer : assignedOfficers) {
                            IncidentUpdate update = new IncidentUpdate();
                            update.setIncident(incident);
                            update.setUpdatedBy(officer.getUser());
                            update.setStatus(incident.getStatus());
                            update.setContent("Initial assignment of " + officer.getName() + " to the incident.");
                            update.setUpdatedAt(reportDateTime);
                            incident.getUpdates().add(update);
                            
                            // Add additional updates for resolved/closed incidents
                            if (incident.getStatus() == Incident.IncidentStatus.RESOLVED ||
                                incident.getStatus() == Incident.IncidentStatus.CLOSED) {
                                
                                // Add investigation update
                                IncidentUpdate investigationUpdate = new IncidentUpdate();
                                investigationUpdate.setIncident(incident);
                                investigationUpdate.setUpdatedBy(officer.getUser());
                                investigationUpdate.setStatus(Incident.IncidentStatus.UNDER_INVESTIGATION);
                                investigationUpdate.setContent("Investigation started by " + officer.getName());
                                investigationUpdate.setUpdatedAt(reportDateTime.plusHours(1));
                                incident.getUpdates().add(investigationUpdate);
                                
                                // Add resolution update
                                IncidentUpdate resolutionUpdate = new IncidentUpdate();
                                resolutionUpdate.setIncident(incident);
                                resolutionUpdate.setUpdatedBy(officer.getUser());
                                resolutionUpdate.setStatus(incident.getStatus());
                                resolutionUpdate.setContent("Incident marked as " + incident.getStatus().toString().toLowerCase() + " by " + officer.getName());
                                resolutionUpdate.setUpdatedAt(reportDateTime.plusHours(2));
                                incident.getUpdates().add(resolutionUpdate);
                            }
                        }
                    }
                }
                
                if (sourceReport != null) {
                    reportDetails.setConversionNotes("Converted from Report #" + sourceReport.getId() + 
                        " on " + LocalDate.now().toString());
                    
                    incident.setReportDetails(reportDetails);
                    
                    // Update the incident description to include that it was created from a report
                    String updatedDescription = incident.getDescription() + "\n\n---\n" +
                        "This incident was created from a report submitted on " + 
                        sourceReport.getDate() + " at " + sourceReport.getTime() + ".\n" +
                        "Original Description: " + sourceReport.getDescription();
                    incident.setDescription(updatedDescription);
                }
            } else {
                // Assign officers for non-report based incidents
                if (!officers.isEmpty()) {
                    Set<Officer> assignedOfficers = new HashSet<>();
                    int officerCount = (i % 2) + 2;
                    for (int j = 0; j < officerCount && j < officers.size(); j++) {
                        assignedOfficers.add(officers.get((i + j) % officers.size()));
                    }
                    incident.setAssignedOfficers(assignedOfficers);
                }
            }
            incidents.add(incident);
        }

        incidentRepository.saveAll(incidents);
        log.info("Created {} incidents", incidents.size());
    }

    private void createAlerts(List<User> users) {
        if (alertRepository.count() > 0) {
            log.info("Alerts already exist, skipping alert creation");
            return;
        }

        List<Alert> alerts = new ArrayList<>();
        String[] alertTitles = {
            "Traffic Congestion", "Planned Power Outage", "Water Supply Disruption",
            "Public Gathering", "Road Construction", "Weather Warning",
            "Missing Child Alert", "Suspicious Activity", "Safety Drill",
            "VIP Movement"
        };

        for (int i = 0; i < 30; i++) {
            Alert alert = new Alert();

            int titleIndex = i % alertTitles.length;
            alert.setTitle(alertTitles[titleIndex] + " - Alert #" + (i+1));
            alert.setDescription("Detailed information about " + alertTitles[titleIndex] +
                    ". Please take necessary precautions and follow instructions.");

            Alert.AlertSeverity[] severities = Alert.AlertSeverity.values();
            alert.setSeverity(severities[i % severities.length]);

            // Set location near Bhopal
            Location location = new Location();
            location.setLatitude(23.2599 + (i % 15) * 0.001);
            location.setLongitude(77.4126 + (i % 10) * 0.001);
            location.setAddress("Alert Location #" + (i+1));
            location.setDistrict(districts[i % districts.length]);
            location.setCity(getRandomCity());
            location.setState("Madhya Pradesh");
            location.setPostalCode(String.format("%06d", 462000 + i));
            location.setCountry("India");
            alert.setLocation(location);

            alert.setRadius(1.0 + (i % 10));
            LocalDateTime startTime = LocalDateTime.now().minusDays(i % 10);
            alert.setStartTime(startTime);
            if (i % 3 != 0) {
                alert.setEndTime(startTime.plusDays((i % 5) + 1));
            }
            alert.setActive(i % 3 != 2);

            List<User> adminOrOfficer = users.stream().filter(u -> u.getRole() == User.Role.ADMIN || u.getRole() == User.Role.OFFICER).toList();
            if (!adminOrOfficer.isEmpty()) {
                alert.setCreatedBy(adminOrOfficer.get(i % adminOrOfficer.size()));
            } else {
                alert.setCreatedBy(users.get(0));
            }

            alerts.add(alert);
        }

        alertRepository.saveAll(alerts);
        log.info("Created {} alerts", alerts.size());
    }

    private void createDisasterAlerts(List<User> users) {
        if (disasterAlertRepository.count() > 0) {
            log.info("Disaster alerts already exist, skipping disaster alert creation");
            return;
        }

        List<DisasterAlert> disasterAlerts = new ArrayList<>();
        DisasterAlert.DisasterType[] types = DisasterAlert.DisasterType.values();

        List<User> adminUsers = users.stream()
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .toList();

        // First admin or first user is used as the creator in alert creation

        for (int i = 0; i < 30; i++) {
            DisasterAlert alert = new DisasterAlert();

            DisasterAlert.DisasterType type = types[i % types.length];
            alert.setType(type);
            alert.setTitle(type + " Alert #" + (i+1));
            alert.setDescription("This is a " + type + " disaster alert. Please follow safety protocols and evacuation procedures if advised.");

            DisasterAlert.AlertSeverity[] severities = DisasterAlert.AlertSeverity.values();
            alert.setSeverity(severities[i % severities.length]);

            int areaCount = (i % 3) + 3;
            List<String> affectedAreas = new ArrayList<>();
            for (int j = 0; j < areaCount; j++) {
                affectedAreas.add(districts[(i + j) % districts.length]);
            }
            alert.setAffectedAreas(new HashSet<>(affectedAreas));

            Location epicenter = new Location();
            epicenter.setLatitude(23.2599 + (i % 15) * 0.001);
            epicenter.setLongitude(77.4126 + (i % 10) * 0.001);
            epicenter.setDistrict(affectedAreas.get(0));
            epicenter.setCity(getRandomCity());
            epicenter.setState("Madhya Pradesh");
            epicenter.setPostalCode(String.format("%06d", 462000 + i));
            epicenter.setCountry("India");
            alert.setEpicenter(epicenter);

            alert.setImpactRadiusKm((double) (10 + (i % 10) * 10));
            LocalDateTime startTime = LocalDateTime.now().minusDays(i % 10);
            alert.setStartTime(startTime);
            if (i % 3 != 0) {
                alert.setEstimatedEndTime(startTime.plusDays((i % 5) + 1));
            }

            if (!adminUsers.isEmpty()) {
                alert.setCreatedBy(adminUsers.get(i % adminUsers.size()));
            } else {
                alert.setCreatedBy(users.get(0));
            }

            Set<String> emergencyContacts = new HashSet<>();
            emergencyContacts.add("Emergency Helpline: 108");
            emergencyContacts.add("Disaster Response: 1077");
            emergencyContacts.add("Local Coordinator: +91987654" + String.format("%04d", i+1));
            alert.setEmergencyContacts(emergencyContacts);

            disasterAlerts.add(alert);
        }

        disasterAlertRepository.saveAll(disasterAlerts);
        log.info("Created {} disaster alerts", disasterAlerts.size());
    }

    private void createGeoFences(List<User> users) {
        if (geoFenceRepository.count() > 0) {
            log.info("Geofences already exist, skipping geofence creation");
            return;
        }

        List<GeoFence> geoFences = new ArrayList<>();
        Random random = new Random();

        List<User> authorizedUsers = users.stream()
                .filter(user -> user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.OFFICER)
                .toList();

        User creator = authorizedUsers.isEmpty() ? users.get(0) : authorizedUsers.get(0);

        for (int i = 0; i < 30; i++) {
            GeoFence geoFence = new GeoFence();

            geoFence.setName("GeoFence #" + (i+1));
            geoFence.setDescription("This geofence is created for security and monitoring purposes in the specified area.");

            GeoFence.FenceType fenceType = i % 2 == 0 ? GeoFence.FenceType.CIRCLE : GeoFence.FenceType.POLYGON;
            geoFence.setType(fenceType);

            GeoFence.FencePurpose[] purposes = GeoFence.FencePurpose.values();
            geoFence.setPurpose(purposes[i % purposes.length]);

            if (fenceType == GeoFence.FenceType.CIRCLE) {
                Location center = new Location();
                center.setLatitude(23.2599 + random.nextDouble() * 0.02 - 0.01); // ~1 km radius around Bhopal
                center.setLongitude(77.4126 + random.nextDouble() * 0.02 - 0.01);
                center.setDistrict(districts[i % districts.length]);
                geoFence.setCenter(center);
                geoFence.setRadiusKm(random.nextDouble() * 4 + 1);
            } else {
                List<GeoFencePoint> polygonPoints = new ArrayList<>();
                int pointCount = random.nextInt(3) + 4;
                double centerLat = 23.2599 + random.nextDouble() * 0.02 - 0.01;
                double centerLon = 77.4126 + random.nextDouble() * 0.02 - 0.01;

                for (int j = 0; j < pointCount; j++) {
                    Location point = new Location();
                    double angle = 2 * Math.PI * j / pointCount;
                    double radius = random.nextDouble() * 0.01 + 0.005; // ~0.5-1.5 km
                    point.setLatitude(centerLat + radius * Math.cos(angle));
                    point.setLongitude(centerLon + radius * Math.sin(angle));
                    point.setDistrict(districts[i % districts.length]);
                    
                    GeoFencePoint fencePoint = new GeoFencePoint();
                    fencePoint.setLocation(point);
                    fencePoint.setPointOrder(j);
                    fencePoint.setGeofence(geoFence);
                    polygonPoints.add(fencePoint);
                }
                geoFence.setPolygonPoints(polygonPoints);
            }

            LocalDateTime startTime = LocalDateTime.now().minusDays(random.nextInt(10));
            geoFence.setStartTime(startTime);
            if (i % 3 != 0) {
                geoFence.setEndTime(startTime.plusDays(random.nextInt(30) + 1));
            }
            geoFence.setActive(i % 5 != 4);
            geoFence.setCreatedBy(creator);

            geoFences.add(geoFence);
        }

        geoFenceRepository.saveAll(geoFences);
        log.info("Created {} geofences", geoFences.size());
    }

    private void createPatrolRoutes(List<PatrolVehicle> vehicles, List<Officer> officers) {
        if (patrolRouteRepository.count() > 0) {
            log.info("Patrol routes already exist, skipping patrol route creation");
            return;
        }
    
        List<PatrolRoute> routes = new ArrayList<>();
        Random random = new Random();
        String[] routeNames = {
            "Downtown Patrol", "Residential Area", "Commercial District", 
            "Industrial Zone", "Park Perimeter", "University Campus", 
            "Shopping District", "Waterfront Patrol", "Suburban Route", 
            "Highway Patrol"
        };
    
        for (int i = 0; i < 10; i++) {
            PatrolRoute route = new PatrolRoute();
            route.setName(routeNames[i % routeNames.length]);
            route.setStatus(PatrolRoute.PatrolStatus.values()[i % 3]); // ACTIVE, COMPLETED, or PENDING
    
            // Create waypoints for the route
            List<PatrolRoute.Waypoint> waypoints = new ArrayList<>();
            int numWaypoints = 5 + random.nextInt(6); // 5-10 waypoints per route
            double baseLat = 23.2599 + (random.nextDouble() * 0.1 - 0.05);
            double baseLng = 77.4126 + (random.nextDouble() * 0.1 - 0.05);
    
            for (int j = 0; j < numWaypoints; j++) {
                waypoints.add(new PatrolRoute.Waypoint(
                    baseLat + (random.nextDouble() * 0.01 - 0.005),
                    baseLng + (random.nextDouble() * 0.01 - 0.005)
                ));
            }
            route.setWaypoints(waypoints);
    
            // Assign an officer (every other route gets an officer)
            if (i % 2 == 0 && !officers.isEmpty()) {
                route.setAssignedOfficer(officers.get(i % officers.size()));
            }
    
            // Assign a vehicle (every third route gets a vehicle)
            if (i % 3 == 0 && !vehicles.isEmpty()) {
                route.setPatrolVehicle(vehicles.get(i % vehicles.size()));
            }
    
            routes.add(route);
        }
    
        patrolRouteRepository.saveAll(routes);
        log.info("Created {} patrol routes", routes.size());
    }

    private void createPatrolVehicles(List<Officer> officers) {
        if (patrolVehicleRepository.count() > 0) {
            log.info("Patrol vehicles already exist, skipping patrol vehicle creation");
            return;
        }
    
        List<PatrolVehicle> vehicles = new ArrayList<>();
        Random random = new Random();
    
        String[] models = {
            "Maruti Gypsy", "Toyota Innova", "Mahindra Scorpio", "Tata Sumo",
            "Royal Enfield Bullet", "Bajaj Pulsar", "Maruti Ertiga", "Tata Nexon",
            "Force Gurkha", "Mahindra Bolero"
        };
    
        for (int i = 0; i < 30; i++) {
            PatrolVehicle vehicle = new PatrolVehicle();
            vehicle.setVehicleNumber("PV-" + String.format("%04d", i+1));
            
            PatrolVehicle.VehicleType[] types = PatrolVehicle.VehicleType.values();
            vehicle.setType(types[i % types.length]);
            vehicle.setModel(models[i % models.length]);
            
            PatrolVehicle.VehicleStatus[] statuses = PatrolVehicle.VehicleStatus.values();
            vehicle.setStatus(statuses[i % statuses.length]);
    
            // Create and set location
            Location location = new Location();
            location.setLatitude(23.2599 + random.nextDouble() * 0.02 - 0.01);
            location.setLongitude(77.4126 + random.nextDouble() * 0.02 - 0.01);
            location.setDistrict(districts[i % districts.length]);
            location.setCity("Bhopal");
            location.setState("Madhya Pradesh");
            location.setCountry("India");
            location.setAddress("Patrol Vehicle Location " + (i + 1));
            vehicle.setLocation(location);
            
            vehicle.setLastLocationUpdate(LocalDateTime.now().minusMinutes(random.nextInt(60)));
    
            // Assign officer to some vehicles
            if (vehicle.getStatus() == PatrolVehicle.VehicleStatus.ASSIGNED && !officers.isEmpty()) {
                Officer officer = officers.get(i % officers.size());
                vehicle.assignOfficer(officer);
            }
    
            vehicles.add(vehicle);
        }
    
        patrolVehicleRepository.saveAll(vehicles);
        log.info("Created {} patrol vehicles", vehicles.size());
    }

    private void createSampleShifts() {
        if (shiftRepository.count() > 0) {
            log.info("Shifts already exist, skipping sample data creation");
            return;
        }

        log.info("Creating sample shifts...");
        
        // Get some officers to assign to shifts
        List<Officer> officers = officerRepository.findAll();
        if (officers.isEmpty()) {
            log.warn("No officers found to assign to shifts");
            return;
        }

        // Create shifts for the next 7 days
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < 7; i++) {
            LocalDateTime shiftDate = now.plusDays(i);
            
            // Morning shift (8:00 - 16:00)
            Shift morningShift = new Shift();
            morningShift.setTitle("Morning Patrol #" + (i + 1));
            morningShift.setType(ShiftType.PATROL);
            morningShift.setStartTime(shiftDate.withHour(8).withMinute(0).withSecond(0));
            morningShift.setEndTime(shiftDate.withHour(16).withMinute(0).withSecond(0));
            Location morningLocation = new Location();
            morningLocation.setLatitude(23.2599 + (i * 0.01));
            morningLocation.setLongitude(77.4126 + (i * 0.01));
            morningLocation.setAddress("Zone " + (i % 5 + 1));
            morningLocation.setDistrict("Bhopal");
            morningLocation.setCity("Bhopal");
            morningLocation.setState("Madhya Pradesh");
            morningLocation.setPostalCode("4620" + (i % 10));
            morningLocation.setCountry("India");
            morningShift.setLocation(morningLocation);
            morningShift.setDescription("Routine patrol in Zone " + (i % 5 + 1));
            morningShift.setStatus(ShiftStatus.PENDING);
            morningShift.setAssignedOfficers(new HashSet<>(officers.subList(0, Math.min(2, officers.size()))));
            shiftRepository.save(morningShift);

            // Afternoon shift (16:00 - 00:00)
            Shift afternoonShift = new Shift();
            afternoonShift.setTitle("Afternoon Patrol #" + (i + 1));
            afternoonShift.setType(ShiftType.PATROL);
            afternoonShift.setStartTime(shiftDate.withHour(16).withMinute(0).withSecond(0));
            afternoonShift.setEndTime(shiftDate.plusDays(1).withHour(0).withMinute(0).withSecond(0));
            Location afternoonLocation = new Location();
            afternoonLocation.setLatitude(23.2599 + ((i + 2) * 0.01));
            afternoonLocation.setLongitude(77.4126 + ((i + 2) * 0.01));
            afternoonLocation.setAddress("Zone " + ((i + 2) % 5 + 1));
            afternoonLocation.setDistrict("Bhopal");
            afternoonLocation.setCity("Bhopal");
            afternoonLocation.setState("Madhya Pradesh");
            afternoonLocation.setPostalCode("4620" + ((i + 2) % 10));
            afternoonLocation.setCountry("India");
            afternoonShift.setLocation(afternoonLocation);
            afternoonShift.setDescription("Routine patrol in Zone " + ((i + 2) % 5 + 1));
            afternoonShift.setStatus(ShiftStatus.PENDING);
            afternoonShift.setAssignedOfficers(new HashSet<>(officers.subList(1, Math.min(3, officers.size()))));
            shiftRepository.save(afternoonShift);

            // Add some special shifts
            if (i % 2 == 0) {
                // Training session
                Shift training = new Shift();
                training.setTitle("Training Session #" + (i / 2 + 1));
                training.setType(ShiftType.TRAINING);
                training.setStartTime(shiftDate.withHour(10).withMinute(0).withSecond(0));
                training.setEndTime(shiftDate.withHour(14).withMinute(0).withSecond(0));
                Location trainingLocation = new Location();
                trainingLocation.setLatitude(23.2599);
                trainingLocation.setLongitude(77.4126);
                trainingLocation.setAddress("Police Training Academy");
                trainingLocation.setDistrict("Bhopal");
                trainingLocation.setCity("Bhopal");
                trainingLocation.setState("Madhya Pradesh");
                trainingLocation.setPostalCode("462001");
                trainingLocation.setCountry("India");
                training.setLocation(trainingLocation);
                training.setDescription("Monthly training session");
                training.setStatus(ShiftStatus.PENDING);
                training.setAssignedOfficers(new HashSet<>(officers));
                shiftRepository.save(training);
            }

            if (i % 3 == 0) {
                // Court appearance
                Shift court = new Shift();
                court.setTitle("Court Appearance #" + (i / 3 + 1));
                court.setType(ShiftType.COURT);
                court.setStartTime(shiftDate.withHour(11).withMinute(0).withSecond(0));
                court.setEndTime(shiftDate.withHour(15).withMinute(0).withSecond(0));
                Location courtLocation = new Location();
                courtLocation.setLatitude(23.2599);
                courtLocation.setLongitude(77.4126);
                courtLocation.setAddress("District Court");
                courtLocation.setDistrict("Bhopal");
                courtLocation.setCity("Bhopal");
                courtLocation.setState("Madhya Pradesh");
                courtLocation.setPostalCode("462001");
                courtLocation.setCountry("India");
                court.setLocation(courtLocation);
                court.setDescription("Scheduled court appearance");
                court.setStatus(ShiftStatus.PENDING);
                court.setAssignedOfficers(new HashSet<>(officers.subList(0, 1)));
                shiftRepository.save(court);
            }
        }
        
        log.info("Created sample shifts");
    }

    private void createWeatherData() {
        log.info("Creating weather data...");
        if (weatherDataRepository.count() > 0) {
            log.info("Weather data already exist, skipping weather data creation");
            return;
        }

        List<WeatherData> weatherDataList = new ArrayList<>();
        Random random = new Random();

        String[] weatherConditions = {
            "Sunny", "Cloudy", "Partly Cloudy", "Rain", "Heavy Rain",
            "Thunderstorm", "Foggy", "Haze", "Clear", "Overcast"
        };

        for (String district : districts) {
            WeatherData currentWeather = new WeatherData();
            currentWeather.setDistrict(district);
            currentWeather.setTemperature(random.nextDouble() * 15 + 20);
            currentWeather.setHumidity(random.nextDouble() * 40 + 40);
            currentWeather.setWindSpeed(random.nextDouble() * 20);
            currentWeather.setWeatherCondition(weatherConditions[random.nextInt(weatherConditions.length)]);
            currentWeather.setPrecipitation(random.nextDouble() * 10);
            currentWeather.setVisibility(random.nextDouble() * 5 + 5);
            currentWeather.setTimestamp(LocalDateTime.now().minusMinutes(random.nextInt(30)));
            currentWeather.setForecastTime(null);

            boolean hasWarning = random.nextInt(10) == 0;
            currentWeather.setIsWarningActive(hasWarning);
            if (hasWarning) {
                String[] warningTypes = {"Heavy Rain", "Thunderstorm", "Flood", "Heatwave", "Strong Winds"};
                currentWeather.setWarningType(warningTypes[random.nextInt(warningTypes.length)]);
                currentWeather.setWarningDescription("Weather warning for " + district + ": " +
                        currentWeather.getWarningType() + ". Take necessary precautions.");
            } else {
                currentWeather.setIsWarningActive(false);
                currentWeather.setWarningType(null);
                currentWeather.setWarningDescription(null);
            }

            weatherDataList.add(currentWeather);

            for (int i = 1; i <= 3; i++) {
                WeatherData forecast = new WeatherData();
                forecast.setDistrict(district);
                forecast.setTemperature(random.nextDouble() * 15 + 20);
                forecast.setHumidity(random.nextDouble() * 40 + 40);
                forecast.setWindSpeed(random.nextDouble() * 20);
                forecast.setWeatherCondition(weatherConditions[random.nextInt(weatherConditions.length)]);
                forecast.setPrecipitation(random.nextDouble() * 10);
                forecast.setVisibility(random.nextDouble() * 5 + 5);
                forecast.setTimestamp(LocalDateTime.now());
                forecast.setForecastTime(LocalDateTime.now().plusDays(i));

                hasWarning = random.nextInt(5) == 0;
                forecast.setIsWarningActive(hasWarning);
                if (hasWarning) {
                    String[] warningTypes = {"Heavy Rain", "Thunderstorm", "Flood", "Heatwave", "Strong Winds"};
                    forecast.setWarningType(warningTypes[random.nextInt(warningTypes.length)]);
                    forecast.setWarningDescription("Weather warning forecast for " + district + " on day " + i + ": " +
                            forecast.getWarningType() + ". Be prepared.");
                } else {
                    forecast.setIsWarningActive(false);
                    forecast.setWarningType(null);
                    forecast.setWarningDescription(null);
                }

                weatherDataList.add(forecast);
            }
        }

        weatherDataRepository.saveAll(weatherDataList);
        log.info("Created {} weather data entries", weatherDataList.size());
    }

    private SystemStatus createComponent(String name, SystemStatus.ComponentStatus status, String description, String version) {
        SystemStatus component = new SystemStatus();
        component.setComponentName(name);
        component.setStatus(status);
        component.setDescription(description);
        component.setVersion(version);
        return component;
    }

    private String getRandomCity() {
        String[] cities = {
            "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain",
            "Sagar", "Rewa", "Satna", "Chhindwara", "Morena"
        };
        return cities[new Random().nextInt(cities.length)];
    }

    // This method is not used but kept for future reference
    @SuppressWarnings("unused")
    private String getRandomState() {
        return "Madhya Pradesh";
    }

    private void createReports() {
        if (reportRepository.count() > 0) {
            log.info("Reports already exist, skipping report creation");
            return;
        }
        
        List<Report> reports = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        Random random = new Random();
        
        // Report priorities
        String[] priorities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"};
        
        // Sample data for reports
        String[][] reportTemplates = {
            // Title, Description, Type, Status, Priority
            {"Suspicious Activity", "Noticed a group of people acting suspiciously near the park", "CRIME", "PENDING", "MEDIUM"},
            {"Car Accident", "Two vehicles collided at the intersection of Main St and 1st Ave", "ACCIDENT", "IN_PROGRESS", "HIGH"},
            {"Flooding", "Heavy rain causing severe flooding on Oak Street", "NATURAL_DISASTER", "PENDING", "HIGH"},
            {"Broken Street Light", "Street light not working on Maple Drive", "INFRASTRUCTURE", "PENDING", "LOW"},
            {"Illegal Dumping", "Someone dumped trash in the public park", "ENVIRONMENTAL", "IN_REVIEW", "LOW"},
            {"Assault Reported", "Witnessed an assault near the shopping mall", "CRIME", "PENDING", "CRITICAL"},
            {"Power Outage", "Entire block has been without power for 2 hours", "INFRASTRUCTURE", "IN_PROGRESS", "HIGH"},
            {"Gas Leak", "Strong smell of gas in the apartment building", "PUBLIC_SAFETY", "PENDING", "CRITICAL"},
            {"Vandalism", "Graffiti on the side of the community center", "CRIME", "PENDING", "LOW"},
            {"Medical Emergency", "Elderly person collapsed near the bus stop", "PUBLIC_SAFETY", "RESOLVED", "HIGH"}
        };
        
        // Sample witness names and contacts
        String[] witnessNames = {
            "John Smith", "Emma Wilson", "Michael Brown", "Sarah Johnson", "David Lee",
            "Jennifer Davis", "Robert Taylor", "Lisa Anderson", "James Wilson", "Patricia Moore"
        };
        
        // Sample evidence descriptions
        String[] evidenceDescriptions = {
            "Photos of the incident", "Video recording", "Audio recording", "Witness statements",
            "Physical evidence collected", "Screenshot of messages", "Medical report", "Police report",
            "Surveillance footage", "Receipts or documents"
        };
        
        List<User> users = userRepository.findAll();
        
        for (int i = 0; i < 30; i++) {
            String[] template = reportTemplates[i % reportTemplates.length];
            
            // Create report time within last 30 days
            LocalDateTime reportTime = now.minusDays(random.nextInt(30))
                                      .minusHours(random.nextInt(24))
                                      .minusMinutes(random.nextInt(60));
            
            // Create report using constructor
            Report report = new Report(
                template[0],                        // title
                template[1],                        // description
                template[2],                        // type
                reportTime,                         // createdAt
                template[3],                        // status
                users.get(random.nextInt(users.size())) // createdBy
            );
            
            // Set additional fields
            report.setPriority(priorities[random.nextInt(priorities.length)]);
            report.setDate(reportTime.toLocalDate().toString());
            report.setTime(reportTime.toLocalTime().toString());
            
            // Set location
            Location location = new Location();
            location.setLatitude(23.2599 + (random.nextDouble() * 0.1 - 0.05));
            location.setLongitude(77.4126 + (random.nextDouble() * 0.1 - 0.05));
            location.setDistrict(districts[random.nextInt(districts.length)]);
            location.setCity("Bhopal");
            location.setState("Madhya Pradesh");
            location.setPostalCode("4620" + random.nextInt(100));
            location.setAddress("Near " + districts[random.nextInt(districts.length)] + " area");
            report.setLocation(location);
            
            // Add witnesses as comma-separated string
            int numWitnesses = random.nextInt(4);
            StringBuilder witnesses = new StringBuilder();
            for (int j = 0; j < numWitnesses; j++) {
                if (j > 0) witnesses.append(", ");
                witnesses.append(witnessNames[random.nextInt(witnessNames.length)]);
            }
            report.setWitnesses(witnesses.toString());
            
            // Add evidence as comma-separated string
            int numEvidence = random.nextInt(3);
            StringBuilder evidence = new StringBuilder();
            for (int j = 0; j < numEvidence; j++) {
                if (j > 0) evidence.append("; ");
                evidence.append(evidenceDescriptions[random.nextInt(evidenceDescriptions.length)]);
            }
            report.setEvidence(evidence.toString());
            
            // Set updated time (within 24 hours of creation)
            report.setUpdatedAt(reportTime.plusMinutes(random.nextInt(1440)));
            
            // Set resolved time for resolved reports
            if (template[3].equals("RESOLVED")) {
                report.setResolvedAt(reportTime.plusHours(random.nextInt(48) + 1));
                report.setResolutionNotes("Issue has been resolved successfully.");
            }
            
            reports.add(report);
        }
        
        reportRepository.saveAll(reports);
        log.info("Created {} sample reports", reports.size());
    }
}