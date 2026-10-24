package site.xylanny.washy.service.impl;

import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.enums.BusinessCode;
import site.xylanny.washy.service.EmailService;
import jakarta.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {
    // 实现邮件验证码服务接口

    // 验证码有效期5分钟，过期后自动失效
    private static final Duration CODE_VALIDITY = Duration.ofMinutes(5);
    // 发送间隔限制：60秒内不能重复发送，防止恶意刷验证码
    private static final Duration SEND_INTERVAL = Duration.ofSeconds(60);
    // 安全的随机数生成器，用于生成6位验证码
    private static final SecureRandom RANDOM = new SecureRandom();

    // 验证码存储容器，生产环境应该使用Redis替代内存存储，因为内存存储在应用重启后会丢失所有验证码
    private final Map<String, EmailCode> codes = new ConcurrentHashMap<>();

    @Resource
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String sender;

    @Override
    public void sendRegisterCode(String email) {
        // 对收件人邮箱地址进行规范化处理
        String normalizedEmail = this.normalizeEmail(email);

        // 检查邮件服务是否配置
        if (StringUtils.isBlank(sender)) {
            throw new BusinessException(
                    BusinessCode.THIRD_PARTY_ERROR,
                    "邮件服务未配置，请设置 MAIL_USERNAME 和 MAIL_PASSWORD"
            );
        }

        // 获取当前时间，从缓存中取出该邮箱上次发送的记录，如果existing不为空且当前时间距上次发送时间<60秒
        Instant now = Instant.now();
        EmailCode existing = codes.get(normalizedEmail);
        if (existing != null && Duration.between(existing.sentAt(), now).compareTo(SEND_INTERVAL) < 0) {
            throw new BusinessException(BusinessCode.EMAIL_CODE_TOO_FREQUENT);
        }

        // 生成6位验证码
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        //
        SimpleMailMessage message = new SimpleMailMessage();
        // 设置发件人
        message.setFrom(sender);
        // 设置收件人
        message.setTo(normalizedEmail);
        // 设置主题
        message.setSubject("Washy 注册验证码");
        // 设置正文
        message.setText("您的注册验证码是：" + code + "，5分钟内有效。");

        try {
            // 发送邮件
            mailSender.send(message);
        } catch (MailException exception) {
            log.error("验证码邮件发送失败，收件人：{}", normalizedEmail, exception);
            throw new BusinessException(
                    BusinessCode.THIRD_PARTY_ERROR,
                    "验证码邮件发送失败，请检查 SMTP 配置和邮箱授权码",
                    exception
            );
        }

        // 将验证码和发送时间存入缓存
        codes.put(normalizedEmail, new EmailCode(code, now));
    }

    @Override
    public void verifyRegisterCode(String email, String code) {
        // 规范化收件人邮箱地址
        String normalizedEmail = this.normalizeEmail(email);
        // 从缓存中取出存储的正确验证码
        EmailCode stored = codes.get(normalizedEmail);
        if (stored == null
                || Duration.between(stored.sentAt(), Instant.now()).compareTo(CODE_VALIDITY) >= 0
                || !stored.code().equals(code)) {
            throw new BusinessException(BusinessCode.EMAIL_CODE_ERROR);
        }
        // 校验通过后立即删除验证码，防止重复使用，实现一次性验证码
        codes.remove(normalizedEmail);
    }

    private String normalizeEmail(String email) {
        if (StringUtils.isBlank(email)) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING);
        }
        return email.trim().toLowerCase();
    }

    private record EmailCode(String code, Instant sentAt) {
    }
}
