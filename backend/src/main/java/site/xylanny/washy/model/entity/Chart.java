package site.xylanny.washy.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 图表表
 * @TableName chart
 */
@TableName(value ="chart")
@Data
public class Chart implements Serializable {
    /**
     * id
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 图表名称
     */
    private String chartName;

    /**
     * 分析目标
     */
    private String chartGoal;

    /**
     * 图表类型
     */
    private String chartType;

    /**
     * 生成的分析结论
     */
    private String chartConclusion;

    /**
     * 图表数据
     */
    private String chartData;

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    /**
     * 是否删除 (0-未删除, 1-已删除)
     */
    private Integer isDelete;

    /**
     * 用户id
     */
    private Long userId;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}