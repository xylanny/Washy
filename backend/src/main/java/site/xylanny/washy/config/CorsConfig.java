package site.xylanny.washy.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Slf4j
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origin:}")
    private String allowedOrigin;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = StringUtils.commaDelimitedListToStringArray(allowedOrigin);

        log.info("CORS 允许的跨域来源：{}（同源请求不受此限制）",
                origins.length == 0 ? "未配置" : String.join(", ", origins));

        registry.addMapping("/**")
                .allowCredentials(true)
                // 支持用逗号配置多个来源，例如 http://localhost:3000,http://127.0.0.1:3000
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("*");
    }
}
