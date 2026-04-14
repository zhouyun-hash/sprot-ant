# 多阶段构建：mvn package 后 docker build -t ant-sports-api .
FROM maven:3.9-eclipse-temurin-11 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:11-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar /app/app.jar
EXPOSE 8080
ENV TZ=Asia/Shanghai
ENTRYPOINT ["java","-jar","/app/app.jar"]
