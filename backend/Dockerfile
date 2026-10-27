# ===第一阶段===
# 用Maven作为构建环境，命令为builder
FROM maven:3.9-eclipse-temurin-17 AS builder
# 容器内工作目录设置为/build
WORKDIR /build
# 先复制pom.xml到工作目录下
COPY pom.xml .
# 预下载所有依赖到本地仓库（Maven中）
RUN mvn dependency:go-offline -B
# 再复制源码
COPY src ./src
# 编译打包，跳过测试，生成jar
RUN mvn clean package -DskipTests -B

# ===第二阶段===
# 换成只有JRE的Alpine镜像（没有Maven、JDK、源码）
FROM eclipse-temurin:17-jre-alpine
# 工作目录设置为/app
WORKDIR /app
# 创建系统用户组和用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# 切换到非root用户运行
USER appuser
# 从构建阶段（第一阶段）生成的jar复制过来，重命名为app.jar
COPY --from=builder /build/target/*.jar app.jar
# 声明容器监听8080端口（当前项目实际上将会是Tomcat监听），实际端口映射看compose文件
EXPOSE 8080
# 容器启动时自动执行该命令，运行后端服务器
# 用 sh -c 是为了让 compose 里的 JAVA_OPTS 能生效（exec 形式不会展开变量）
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
