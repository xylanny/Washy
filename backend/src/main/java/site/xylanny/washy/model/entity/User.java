package site.xylanny.washy.model.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 用户表
 * @TableName user
 */
@TableName(value ="user")
@Data
public class User implements Serializable {
    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_ID) // ！
    private Long id;

    /**
     * 用户昵称
     */
    private String userName;

    /**
     * 用户邮箱
     */
    private String userEmail;

    /**
     * 密码
     */
    private String userPassword;

    /**
     * 用户头像
     */
    private String userAvatar;

    /**
     * 用户角色: user/admin
     */
    private String userRole;

    /**
     * 创建时间
     */
    // 自动填充时间
    private Date createTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    /**
     * 是否删除 (0-未删除, 1-已删除)
     */
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}