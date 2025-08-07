package com.civiguard;

import com.civiguard.repository.OfficerRepository;
import com.civiguard.repository.ShiftRepository;
import com.civiguard.util.ShiftValidator;
import org.modelmapper.ModelMapper;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestConfig {

    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    @Bean
    public ShiftValidator shiftValidator(ShiftRepository shiftRepository, OfficerRepository officerRepository) {
        return new ShiftValidator(shiftRepository, officerRepository);
    }
}
