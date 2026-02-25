package com.edtech.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("platform_order")
public class Order implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private String orderNo;
    private Long userId;
    private BigDecimal amount;
    private String status; // PENDING, PAID, CANCELLED, REFUNDED
    private String paymentMethod; // STRIPE, ALIPAY, MOCK
    private String transactionId;
    private String planSnapshot; // JSON

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;
}
