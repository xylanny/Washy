package site.xylanny.washy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import site.xylanny.washy.exception.BusinessException;
import site.xylanny.washy.model.dto.UserVO;
import site.xylanny.washy.model.entity.User;
import site.xylanny.washy.model.enums.BusinessCode;
import site.xylanny.washy.service.UserService;
import site.xylanny.washy.service.EmailService;
import site.xylanny.washy.mapper.UserMapper;
import site.xylanny.washy.utils.PasswordUtil;
import site.xylanny.washy.utils.TokenUtil;
import jakarta.annotation.Resource;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * @author Jun
 * @description 针对表【user(用户表)】的数据库操作Service实现
 * @createDate 2026-09-08 10:56:19
 */
@Service
public class UserServiceImpl implements UserService {

    @Resource
    private UserMapper userMapper;

    @Resource
    private TokenUtil tokenUtil;

    @Resource
    private EmailService emailService;

    @Resource
    private PasswordUtil passwordUtil;


    @Override
    public UserVO register(String userName, String userEmail, String emailCode,
                           String userPassword, String checkPassword) {
        if (StringUtils.isAnyBlank(userName, userEmail, emailCode, userPassword, checkPassword)) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING);
        }
        emailService.verifyRegisterCode(userEmail, emailCode);

        if (!userPassword.equals(checkPassword)) {
            throw new BusinessException(BusinessCode.PASSWORD_DISPARITY);
        }

        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUserEmail, userEmail);
        User existedUser = userMapper.selectOne(queryWrapper);

        if (existedUser != null) {
            throw new BusinessException(BusinessCode.USER_EXISTS);
        }

        if (userPassword.length() < 6 || userPassword.length() > 12) {
            throw new BusinessException(BusinessCode.PARAMS_ERROR, "密码长度需在 6~12 位之间");
        }

        User user = new User();
        user.setUserName(userName);
        user.setUserEmail(userEmail);
        // 额外加密
        user.setUserPassword(passwordUtil.encode(userPassword));
        user.setUserRole("user");
        user.setIsDelete(0);
        Date now = new Date();
        user.setCreateTime(now);
        user.setUpdateTime(now);

        // 存储到数据库中
        int effectiveRow = userMapper.insert(user);
        if (effectiveRow != 1) {
            throw new BusinessException(BusinessCode.DATABASE_ERROR, "用户注册失败");
        }

        // 去敏
        UserVO userVO = this.getUserVO(user);
        // 加入token
        userVO.setToken(tokenUtil.createToken(user.getId()));

        return userVO;
    }


    @Override
    public void sendRegisterEmailCode(String userEmail) {
        emailService.sendRegisterCode(userEmail);
    }


    @Override
    public UserVO login(String userEmail, String userPassword) {

        if (StringUtils.isAnyBlank(userEmail, userPassword)) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING);
        }

        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUserEmail, userEmail)
                .eq(User::getIsDelete, 0);
        User user = userMapper.selectOne(queryWrapper);

        if (user == null) {
            throw new BusinessException(BusinessCode.USER_NOT_EXISTS);
        }

        // 调用工具类静态方法比较
        if (!passwordUtil.matches(userPassword, user.getUserPassword())) {
            throw new BusinessException(BusinessCode.PASSWORD_ERROR);
        }

        // 去敏
        UserVO userVO = this.getUserVO(user);
        // 加入token
        userVO.setToken(tokenUtil.createToken(user.getId()));

        return userVO;
    }

    @Override
    public UserVO getUserByAuthorization(String authorization) {
        long userId = tokenUtil.getUserId(authorization);

        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getId, userId);
        User currentUser = userMapper.selectOne(queryWrapper);

        if (currentUser == null) {
            throw new BusinessException(BusinessCode.NOT_LOGIN);
        }

        UserVO userVO = this.getUserVO(currentUser);

        return userVO;
    }

    @Override
    public UserVO update(User user) {
        if (user == null || user.getId() == null) {
            throw new BusinessException(BusinessCode.PARAMS_MISSING, "用户ID不能为空");
        }

        User existedUser = userMapper.selectById(user.getId());
        if (existedUser == null) {
            throw new BusinessException(BusinessCode.USER_NOT_EXISTS);
        }
        if (StringUtils.isNotBlank(user.getUserName())) {
            existedUser.setUserName(user.getUserName());
        }
        if (StringUtils.isNotBlank(user.getUserEmail())) {
            existedUser.setUserEmail(user.getUserEmail());
        }
        if (StringUtils.isNotBlank(user.getUserAvatar())) {
            existedUser.setUserAvatar(user.getUserAvatar());
        }
        existedUser.setUpdateTime(new Date());

        // 更新到数据库中
        int effectiveRow = userMapper.updateById(existedUser);
        if (effectiveRow != 1) {
            throw new BusinessException(BusinessCode.DATABASE_ERROR, "用户更新信息失败");
        }

        return this.getUserVO(existedUser);
    }

    @Override
    public UserVO getUserVO(User user) {
        if (user == null) {
            return null;
        }
        UserVO userVO = new UserVO();
        BeanUtils.copyProperties(user, userVO);

        return userVO;
    }

}
