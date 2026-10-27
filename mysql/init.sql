-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS washy_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE washy_db;

-- 创建用户表（增加了唯一索引）
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'id',
    `user_name` VARCHAR(256) NOT NULL COMMENT '用户昵称',
    `user_email` VARCHAR(256) NOT NULL COMMENT '用户邮箱',
    `user_password` VARCHAR(512) NOT NULL COMMENT '密码',
    `user_avatar` TEXT DEFAULT NULL COMMENT '用户头像',
    `user_role` VARCHAR(256) DEFAULT 'user' COMMENT '用户角色: user/admin',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete` TINYINT DEFAULT 0 COMMENT '是否删除 (0-未删除, 1-已删除)',
    UNIQUE KEY `uk_user_email` (`user_email`)  -- 确保邮箱唯一
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建图表表
CREATE TABLE IF NOT EXISTS `chart` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'id',
    `chart_name` VARCHAR(128) NOT NULL COMMENT '图表名称',
    `chart_goal` TEXT DEFAULT NULL COMMENT '分析目标',
    `chart_type` VARCHAR(128) NOT NULL COMMENT '图表类型',
    `chart_conclusion` TEXT DEFAULT NULL COMMENT '生成的分析结论',
    `chart_data` TEXT DEFAULT NULL COMMENT '图表数据',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete` TINYINT DEFAULT 0 COMMENT '是否删除 (0-未删除, 1-已删除)',
    `user_id` BIGINT NOT NULL COMMENT '用户id',
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_chart_user_id`
        FOREIGN KEY (`user_id`)
        REFERENCES `user` (`id`)
        ON DELETE CASCADE  -- 删除用户时删除其图表
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表表';