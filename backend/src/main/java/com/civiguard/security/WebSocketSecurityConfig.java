// package com.civiguard.security;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.core.Ordered;
// import org.springframework.core.annotation.Order;
// import org.springframework.lang.NonNull;
// import org.springframework.messaging.simp.SimpMessageType;
// import org.springframework.messaging.simp.config.ChannelRegistration;
// import org.springframework.messaging.simp.config.MessageBrokerRegistry;
// import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
// import org.springframework.security.config.annotation.web.socket.WebSocketMessageBrokerSecurityBeanDefinitionParser;
// import org.springframework.security.config.annotation.web.socket.configuration.EnableWebSocketMessageBroker;
// import org.springframework.security.config.annotation.web.socket.configuration.WebSocketMessageBrokerSecurityConfiguration;
// import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
// import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
// import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
// import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

// @Configuration
// @EnableWebSocketMessageBroker
// @EnableWebSocketSecurity
// @Order(Ordered.HIGHEST_PRECEDENCE + 99)
// public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {
    
//     private final AuthChannelInterceptor authChannelInterceptor;
    
//     public WebSocketSecurityConfig(AuthChannelInterceptor authChannelInterceptor) {
//         this.authChannelInterceptor = authChannelInterceptor;
//     }

//     @Override
//     public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
//         // Public WebSocket endpoint for clients to connect
//         registry.addEndpoint("/ws")
//                 .setAllowedOriginPatterns("*")
//                 .withSockJS();
                
//         // Fallback endpoint for native WebSocket
//         registry.addEndpoint("/ws")
//                 .setAllowedOriginPatterns("*");
//     }

//     @Override
//     public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
//         // Enable a simple in-memory broker for topics and queues
//         config.enableSimpleBroker(
//             "/topic",   // For broadcasting to all subscribers
//             "/queue"    // For user-specific messages
//         );
        
//         // Set the application destination prefix
//         config.setApplicationDestinationPrefixes("/app");
        
//         // Set the user destination prefix for user-specific messaging
//         config.setUserDestinationPrefix("/user");
//     }

//     @Override
//     public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
//         // Add interceptors for authentication/authorization
//         registration.interceptors(authChannelInterceptor);
//     }
    
//     @Bean
//     public StompSubProtocolErrorHandler errorHandler() {
//         return new StompSubProtocolErrorHandler();
//     }
    
//     @Override
//     public void configureMessageBroker(MessageBrokerRegistry config) {
//         // Enable a simple message broker and configure the destination prefixes
//         config.enableSimpleBroker("/topic", "/queue");
        
//         // Set the application destination prefix for client-to-server messages
//         config.setApplicationDestinationPrefixes("/app");
        
//         // Set the user destination prefix for user-specific messages
//         config.setUserDestinationPrefix("/user");
//     }
    
//     @Override
//     public void configureClientInboundChannel(ChannelRegistration registration) {
//         // Add our authentication interceptor
//         registration.interceptors(authChannelInterceptor);
//     }
    
//     @Bean
//     public WebSocketMessageBrokerSecurityBeanDefinitionParser webSocketMessageBrokerSecurityBeanDefinitionParser() {
//         return new WebSocketMessageBrokerSecurityBeanDefinitionParser();
//     }
    
//     @Bean
//     public WebSocketMessageBrokerSecurityConfiguration webSocketMessageBrokerSecurityConfiguration() {
//         return new WebSocketMessageBrokerSecurityConfiguration() {
//             @Override
//             protected boolean sameOriginDisabled() {
//                 // Disable CSRF for WebSocket connections
//                 return true;
//             }
//         };
//     }

//     @Override
//     public void configureClientOutboundChannel(@NonNull ChannelRegistration registration) {
//         // Add interceptors here if needed for outgoing messages
//         registration.taskExecutor().corePoolSize(4);
//     }
    
//     @Override
//     public void configureWebSocketTransport(@NonNull WebSocketTransportRegistration registry) {
//         registry.setMessageSizeLimit(1024 * 1024);
//         registry.setSendBufferSizeLimit(1024 * 1024);
//         registry.setSendTimeLimit(20000);
//     }
// }
