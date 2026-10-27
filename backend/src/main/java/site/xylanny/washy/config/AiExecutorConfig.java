package site.xylanny.washy.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * AI 流式对话使用的线程池。
 *
 * <p>SSE 请求会一直占用线程直到模型输出结束，因此单独开一个带名字的池子，
 * 避免和普通 Web 请求的线程互相影响。</p>
 */
@Configuration
public class AiExecutorConfig {

    @Bean(name = "aiStreamExecutor", destroyMethod = "shutdownNow")
    public ExecutorService aiStreamExecutor(AiProperties properties) {
        int poolSize = properties.getStreamPoolSize() != null && properties.getStreamPoolSize() > 0
                ? properties.getStreamPoolSize()
                : 8;

        AtomicInteger counter = new AtomicInteger();
        return Executors.newFixedThreadPool(poolSize, runnable -> {
            Thread thread = new Thread(runnable, "ai-stream-" + counter.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        });
    }
}
