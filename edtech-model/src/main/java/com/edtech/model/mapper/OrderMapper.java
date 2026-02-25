package com.edtech.model.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.edtech.model.entity.Order;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderMapper extends BaseMapper<Order> {
}
