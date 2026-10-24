package site.xylanny.washy.controller;

import site.xylanny.washy.model.entity.User;
import site.xylanny.washy.service.UserService;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;
import site.xylanny.washy.model.dto.*;

@RestController
@RequestMapping("/user")
public class UserController {
    @Resource
    private UserService userService;

    @PostMapping("/register")
    public Result<UserVO> register(@RequestBody UserRegisterDTO userRegisterDTO){

        UserVO userVO = userService.register(
                userRegisterDTO.getUserName(),
                userRegisterDTO.getUserEmail(),
                userRegisterDTO.getEmailCode(),
                userRegisterDTO.getUserPassword(),
                userRegisterDTO.getCheckedPassword()
        );

        return Result.success(userVO);
    }

    @PostMapping("/mail")
    public Result<Void> sendEmailCode(@RequestParam String userEmail) {
        userService.sendRegisterEmailCode(userEmail);
        return Result.success(null);
    }

    @PostMapping("/login")
    public Result<UserVO> login(@RequestBody UserLoginDTO userLoginDTO){
        UserVO userVO = userService.login(
                userLoginDTO.getUserEmail(),
                userLoginDTO.getUserPassword()
        );

        return Result.success(userVO);
    }

    @GetMapping("/info")
    @SecurityRequirement(name = "bearerAuth")
    public Result<UserVO> getUserByAuthorization(HttpServletRequest request){
        String authorization = request.getHeader("Authorization");

        UserVO userVO = userService.getUserByAuthorization(authorization);

        return Result.success(userVO);
    }

    @PostMapping("/update")
    @SecurityRequirement(name = "bearerAuth")
    public Result<UserVO> update(@RequestBody UserUpdateDTO userUpdateDTO, HttpServletRequest request){
         String authorization = request.getHeader("Authorization");

         long userId = userService.getUserByAuthorization(authorization).getId();

         User newUser = new User();
         BeanUtils.copyProperties(userUpdateDTO, newUser);
         newUser.setId(userId);

         UserVO userVO = userService.update(newUser);

         return Result.success(userVO);
    }
}
