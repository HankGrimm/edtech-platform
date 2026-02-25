package com.edtech.web.controller;

import com.edtech.model.entity.Order;
import com.edtech.model.entity.SubscriptionPlan;
import com.edtech.web.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        return 1L;
    }

    /** 获取所有可用套餐 */
    @GetMapping("/plans")
    public List<SubscriptionPlan> getPlans() {
        return paymentService.getActivePlans();
    }

    /** 创建订单 */
    @PostMapping("/create-order")
    public Map<String, Object> createOrder(@RequestBody Map<String, Object> body) {
        Long planId = Long.valueOf(body.get("planId").toString());
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "MOCK");
        Order order = paymentService.createOrder(getCurrentUserId(), planId, paymentMethod);
        return Map.of("success", true, "orderNo", order.getOrderNo(),
                "amount", order.getAmount(), "status", order.getStatus());
    }

    /** 获取当前用户订单列表 */
    @GetMapping("/orders")
    public List<Order> getOrders() {
        return paymentService.getUserOrders(getCurrentUserId());
    }

    /** 模拟支付（演示用） */
    @PostMapping("/mock-pay/{orderNo}")
    public Map<String, Object> mockPay(@PathVariable String orderNo) {
        Order order = paymentService.mockPay(orderNo);
        return Map.of("success", true, "orderNo", order.getOrderNo(),
                "status", order.getStatus(), "transactionId", order.getTransactionId());
    }

    /** 取消订单 */
    @PostMapping("/cancel/{orderNo}")
    public Map<String, Object> cancelOrder(@PathVariable String orderNo) {
        Order order = paymentService.cancelOrder(orderNo, getCurrentUserId());
        return Map.of("success", true, "orderNo", order.getOrderNo(), "status", order.getStatus());
    }
}
