package com.edtech.web.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edtech.model.entity.Order;
import com.edtech.model.entity.SubscriptionPlan;
import com.edtech.model.mapper.OrderMapper;
import com.edtech.model.mapper.SubscriptionPlanMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final OrderMapper orderMapper;
    private final SubscriptionPlanMapper planMapper;

    public List<SubscriptionPlan> getActivePlans() {
        return planMapper.selectList(new LambdaQueryWrapper<SubscriptionPlan>()
                .eq(SubscriptionPlan::getIsActive, true));
    }

    @Transactional
    public Order createOrder(Long userId, Long planId, String paymentMethod) {
        SubscriptionPlan plan = planMapper.selectById(planId);
        if (plan == null) throw new RuntimeException("套餐不存在");

        String orderNo = "EDU" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        Order order = new Order();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setAmount(plan.getPrice());
        order.setStatus("PENDING");
        order.setPaymentMethod(paymentMethod != null ? paymentMethod : "MOCK");
        order.setPlanSnapshot("{\"id\":" + plan.getId() + ",\"name\":\"" + plan.getName()
                + "\",\"price\":" + plan.getPrice() + ",\"durationDays\":" + plan.getDurationDays() + "}");
        order.setCreatedAt(LocalDateTime.now());
        orderMapper.insert(order);

        log.info("创建订单: orderNo={}, userId={}, plan={}, amount={}", orderNo, userId, plan.getName(), plan.getPrice());
        return order;
    }

    public List<Order> getUserOrders(Long userId) {
        return orderMapper.selectList(new LambdaQueryWrapper<Order>()
                .eq(Order::getUserId, userId)
                .orderByDesc(Order::getCreatedAt));
    }

    @Transactional
    public Order mockPay(String orderNo) {
        Order order = orderMapper.selectOne(new LambdaQueryWrapper<Order>()
                .eq(Order::getOrderNo, orderNo));
        if (order == null) throw new RuntimeException("订单不存在");
        if (!"PENDING".equals(order.getStatus())) throw new RuntimeException("订单状态异常: " + order.getStatus());

        order.setStatus("PAID");
        order.setTransactionId("MOCK_TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setPaidAt(LocalDateTime.now());
        orderMapper.updateById(order);

        log.info("模拟支付成功: orderNo={}, txn={}", orderNo, order.getTransactionId());
        return order;
    }

    @Transactional
    public Order cancelOrder(String orderNo, Long userId) {
        Order order = orderMapper.selectOne(new LambdaQueryWrapper<Order>()
                .eq(Order::getOrderNo, orderNo)
                .eq(Order::getUserId, userId));
        if (order == null) throw new RuntimeException("订单不存在");
        if (!"PENDING".equals(order.getStatus())) throw new RuntimeException("只能取消待支付订单");

        order.setStatus("CANCELLED");
        orderMapper.updateById(order);
        return order;
    }
}
